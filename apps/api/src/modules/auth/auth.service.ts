import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

const resetCodes = new Map<string, { code: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private async generatePublicId(): Promise<string> {
    const count = await this.prisma.user.count();
    let num = 1001 + count;
    while (true) {
      const candidate = `KY-${num}`;
      const exists = await this.prisma.user.findUnique({ where: { publicId: candidate } });
      if (!exists) return candidate;
      num++;
    }
  }

  private async generateUsername(base: string): Promise<string> {
    const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
    let candidate = clean;
    let i = 1;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${clean}${i}`;
      i++;
    }
    return candidate;
  }

  async ensureIds(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const publicId = user?.publicId || (await this.generatePublicId());
    const username = user?.username || (await this.generateUsername(email.split("@")[0]));
    if (!user?.publicId || !user?.username) {
      await this.prisma.user.update({ where: { id: userId }, data: { publicId, username } });
    }
    return { publicId, username };
  }

  async register(rawBody: any, ip: string) {
    const email = String(rawBody?.email || "").trim().toLowerCase();
    const password = String(rawBody?.password || "");
    const firstName = String(rawBody?.firstName || "").trim();
    const lastName = String(rawBody?.lastName || "").trim();
    const role = rawBody?.role === "TEACHER" ? "TEACHER" : "STUDENT";
    const phone = rawBody?.phone ? String(rawBody.phone).trim() : null;
    const rawUsername = String(rawBody?.username || "").trim().replace(/^@/, "").toLowerCase();

    if (!email || !email.includes("@")) throw new BadRequestException("To‘g‘ri email manzilini kiriting");
    if (password.length < 6) throw new BadRequestException("Parol kamida 6 ta belgidan iborat bo‘lishi kerak");
    if (!firstName || !lastName) throw new BadRequestException("Ism va familiya majburiy");

    const username = rawUsername
      ? rawUsername.replace(/[^a-z0-9_]/g, "")
      : await this.generateUsername(`${firstName}_${lastName}`);

    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }, ...(phone ? [{ phone }] : [])],
      },
    });
    if (exists) {
      throw new BadRequestException("Ushbu email, foydalanuvchi nomi (@username) yoki telefon raqam band");
    }

    const defaultSchool = await this.prisma.school.findFirst({ where: { deletedAt: null } });
    const publicId = await this.generatePublicId();
    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        publicId,
        username,
        email,
        phone,
        passwordHash,
        role,
        schoolId: rawBody?.schoolId || defaultSchool?.id || null,
        verificationToken: crypto.randomBytes(24).toString("hex"),
        profile: {
          create: {
            firstName,
            lastName,
            termsAccepted: true,
            privacyAccepted: true,
          },
        },
        ...(role === "STUDENT"
          ? {
              studentProfile: {
                create: {
                  grade: rawBody?.grade || "9-sinf",
                  region: "Toshkent",
                  district: "Markaziy",
                  interests: [],
                },
              },
            }
          : {
              teacherProfile: {
                create: {
                  subjects: Array.isArray(rawBody?.subjects) ? rawBody.subjects : ["Kasbga yo‘naltirish"],
                  education: "Oliy",
                  experienceYears: Number(rawBody?.experienceYears || 0),
                },
              },
            }),
      },
      include: { profile: true, school: true },
    });

    const tokens = await this.issueTokens(user, ip);
    return {
      message: `Muvaffaqiyatli ro‘yxatdan o‘tdingiz! ID: ${publicId} | @${username}`,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        publicId: user.publicId,
        username: user.username,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        role: user.role,
        profile: user.profile,
      },
    };
  }

  getGoogleAuthUrl(role: "STUDENT" | "TEACHER") {
    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/v1/auth/google/callback";

    if (!clientId || !clientId.endsWith(".apps.googleusercontent.com")) {
      const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
      return `${frontendUrl}/login?error=${encodeURIComponent(
        "GOOGLE_CLIENT_ID sozlanmagan! Google Cloud Console dan Client ID va Client Secret olib .env ga kiriting.",
      )}`;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state: role,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, state: string, ip: string) {
    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/v1/auth/google/callback";

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new UnauthorizedException(`Google token almashishda xatolik: ${errText}`);
    }

    const tokenData: any = await tokenRes.json();
    return this.googleAuth({ accessToken: tokenData.access_token, role: state }, ip);
  }

  async googleAuth(body: any, ip: string) {
    let email = "";
    let firstName = "Google";
    let lastName = "Foydalanuvchi";
    let googleSub = "";
    let pictureUrl: string | null = null;

    if (body.accessToken) {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${body.accessToken}` },
      });
      if (!userInfoRes.ok) {
        throw new UnauthorizedException("Google akkaunt tasdiqlanmadi yoki token muddati tugagan");
      }
      const profile: any = await userInfoRes.json();
      email = String(profile.email || "").trim().toLowerCase();
      firstName = String(profile.given_name || profile.name || "Google").trim();
      lastName = String(profile.family_name || "Foydalanuvchi").trim();
      googleSub = String(profile.sub || "");
      pictureUrl = profile.picture ? String(profile.picture) : null;
    } else if (body.idToken) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.idToken)}`,
      );
      if (!verifyRes.ok) {
        throw new UnauthorizedException("Google tokeni yaroqsiz");
      }
      const payload: any = await verifyRes.json();
      email = String(payload.email || "").trim().toLowerCase();
      firstName = String(payload.given_name || payload.name || "Google").trim();
      lastName = String(payload.family_name || "Foydalanuvchi").trim();
      googleSub = String(payload.sub || "");
      pictureUrl = payload.picture ? String(payload.picture) : null;
    } else {
      throw new BadRequestException("Google avtorizatsiya tokeni topilmadi");
    }

    if (!email) throw new BadRequestException("Google akkauntdan email olinmadi");

    let user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { profile: true, school: true },
    });

    if (!user) {
      const defaultSchool = await this.prisma.school.findFirst({ where: { deletedAt: null } });
      const publicId = await this.generatePublicId();
      const username = await this.generateUsername(email.split("@")[0]);
      const role = body.role === "TEACHER" ? "TEACHER" : "STUDENT";
      const randomPass = await argon2.hash(crypto.randomBytes(24).toString("hex"));

      user = await this.prisma.user.create({
        data: {
          publicId,
          username,
          googleId: googleSub || `google_${crypto.randomBytes(8).toString("hex")}`,
          email,
          emailVerified: true,
          passwordHash: randomPass,
          role,
          schoolId: defaultSchool?.id || null,
          profile: {
            create: {
              firstName,
              lastName,
              avatarUrl: pictureUrl,
              termsAccepted: true,
              privacyAccepted: true,
            },
          },
          ...(role === "STUDENT"
            ? { studentProfile: { create: { grade: "9-sinf", region: "Toshkent", district: "Markaziy", interests: [] } } }
            : { teacherProfile: { create: { subjects: ["Umumiy fanlar"], education: "Oliy", experienceYears: 1 } } }),
        },
        include: { profile: true, school: true },
      });
    } else {
      const ids = await this.ensureIds(user.id, user.email);
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          googleId: googleSub || user.googleId,
          publicId: ids.publicId,
          username: ids.username,
        },
        include: { profile: true, school: true },
      });
    }

    const tokens = await this.issueTokens(user, ip);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        publicId: user.publicId,
        username: user.username,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        role: user.role,
        profile: user.profile,
      },
    };
  }
  async requestPasswordReset(rawIdentifier: string) {
    const query = String(rawIdentifier || "").trim();
    if (!query) throw new BadRequestException("Email, @username yoki KY-ID kiriting");

    const cleanUsername = query.replace(/^@/, "").toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: { equals: query.toLowerCase(), mode: "insensitive" } },
          { username: { equals: cleanUsername, mode: "insensitive" } },
          { publicId: { equals: query.toUpperCase(), mode: "insensitive" } },
        ],
      },
      include: { profile: true },
    });

    if (!user) {
      throw new BadRequestException("Bunday foydalanuvchi topilmadi. Email yoki @username ni tekshiring.");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(user.id, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    return {
      message: `${user.email} manzili uchun 6 xonali parol tiklash kodi yaratildi`,
      maskedEmail: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
      devCode: code,
    };
  }

  async confirmPasswordReset(rawIdentifier: string, code: string, newPassword: string) {
    const query = String(rawIdentifier || "").trim();
    if (!query || !code || !newPassword) {
      throw new BadRequestException("Barcha maydonlarni to‘ldiring");
    }
    if (newPassword.length < 6) {
      throw new BadRequestException("Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak");
    }

    const cleanUsername = query.replace(/^@/, "").toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: { equals: query.toLowerCase(), mode: "insensitive" } },
          { username: { equals: cleanUsername, mode: "insensitive" } },
          { publicId: { equals: query.toUpperCase(), mode: "insensitive" } },
        ],
      },
    });

    if (!user) throw new BadRequestException("Foydalanuvchi topilmadi");

    const entry = resetCodes.get(user.id);
    if (!entry || entry.expiresAt < Date.now() || entry.code !== String(code).trim()) {
      throw new BadRequestException("Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan");
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    resetCodes.delete(user.id);

    return { message: "Parolingiz muvaffaqiyatli yangilandi! Endi yangi parol bilan kiring." };
  }

  async login(rawBody: any, ip: string) {
    const identifier = String(rawBody?.email || "").trim().toLowerCase().replace(/^@/, "");
    const password = String(rawBody?.password || "");
    if (!identifier || !password) throw new BadRequestException("Login (email yoki @username) va parolni kiriting");

    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { username: identifier }, { publicId: identifier.toUpperCase() }],
      },
      include: { profile: true, school: true },
    });
    if (!user) throw new UnauthorizedException("Login yoki parol noto‘g‘ri");

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException("Hisob vaqtincha bloklangan");
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null },
      });
      throw new UnauthorizedException("Login yoki parol noto‘g‘ri");
    }

    const ids = await this.ensureIds(user.id, user.email);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, publicId: ids.publicId, username: ids.username },
    });

    const tokens = await this.issueTokens(user, ip);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        publicId: ids.publicId,
        username: ids.username,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        role: user.role,
        profile: user.profile,
      },
    };
  }

  private async issueTokens(user: { id: string; email: string; role: string; schoolId: string | null }, ip: string) {
    const payload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
      expiresIn: "7d",
    });
    const refreshRaw = crypto.randomBytes(48).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshRaw),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        ipAddress: ip,
      },
    });
    return { accessToken, refreshToken: refreshRaw };
  }

  async refresh(refreshToken: string | undefined, ip: string) {
    if (!refreshToken) throw new UnauthorizedException("Refresh token topilmadi");
    const hash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new UnauthorizedException("Refresh token yaroqsiz");
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user, ip);
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hashToken(refreshToken) }, data: { revokedAt: new Date() } });
    }
    return { message: "Tizimdan chiqildi" };
  }
}