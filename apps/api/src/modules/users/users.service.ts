import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(actor: { sub: string; role: UserRole; schoolId?: string }, roleFilter?: UserRole, _ip?: string) {
    const where: any = { deletedAt: null };
    if (actor.role === UserRole.TEACHER) {
      where.enrollments = { some: { course: { teacherId: actor.sub } } };
    } else if (actor.role !== UserRole.SUPER_ADMIN) {
      where.schoolId = actor.schoolId ?? "__forbidden__";
    }
    if (roleFilter) where.role = roleFilter;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        publicId: true,
        username: true,
        email: true,
        phone: true,
        phoneVerified: true,
        role: true,
        profile: true,
        studentProfile: true,
        teacherProfile: true,
        interestResults: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // O'qituvchi sinfga qo'shishi uchun o'quvchilarni ID, @username yoki ism bo'yicha qidirish
  async searchStudentsByIdOrName(query: string) {
    const q = String(query || "").trim().replace(/^@/, "");
    return this.prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        deletedAt: null, publicId: { not: null }, username: { not: null },
        ...(q
          ? {
              OR: [
                { publicId: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
                { profile: { firstName: { contains: q, mode: "insensitive" } } },
                { profile: { lastName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        publicId: true,
        username: true,
        profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
        studentProfile: { select: { grade: true, schoolName: true, isVerified: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
  }

  // Muloqot uchun foydalanuvchilarni @username, ism yoki KY-ID bo'yicha qidirish (faqat ochiq ma'lumotlar qaytadi)
  async searchForChat(actorId: string, query: string) {
    const q = String(query || "").trim().replace(/^@/, "");
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: actorId },
        deletedAt: null, publicId: { not: null }, username: { not: null },
        ...(q
          ? {
              OR: [
                { username: { contains: q, mode: "insensitive" } },
                { publicId: { contains: q, mode: "insensitive" } },
                { profile: { firstName: { contains: q, mode: "insensitive" } } },
                { profile: { lastName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        publicId: true,
        username: true,
        role: true,
        profile: { select: { firstName: true, lastName: true, avatarUrl: true, bio: true } },
        studentProfile: { select: { grade: true, schoolName: true, isVerified: true } },
        teacherProfile: { select: { subjects: true, workplace: true, experienceYears: true, isVerified: true } },
      },
      take: 25,
      orderBy: { createdAt: "desc" },
    });
    return users;
  }

  async getChatConversations(userId: string) {
    const messages = await this.prisma.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, publicId: true, username: true, role: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        receiver: { select: { id: true, publicId: true, username: true, role: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const peersMap = new Map<string, any>();
    for (const m of messages) {
      const peer = m.senderId === userId ? m.receiver : m.sender;
      if (!peersMap.has(peer.id)) {
        peersMap.set(peer.id, {
          peer,
          lastMessage: m.text,
          lastAt: m.createdAt,
          unreadCount: m.receiverId === userId && !m.isRead ? 1 : 0,
        });
      } else if (m.receiverId === userId && !m.isRead) {
        peersMap.get(peer.id).unreadCount += 1;
      }
    }
    return Array.from(peersMap.values());
  }

  async getMessagesWithPeer(userId: string, peerId: string) {
    await this.prisma.directMessage.updateMany({
      where: { senderId: peerId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    return this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 150,
    });
  }

  async sendMessageToPeer(senderId: string, receiverId: string, text: string) {
    const clean = String(text || "").trim();
    if (!clean) throw new BadRequestException("Xabar matni bo‘sh bo‘lmasligi kerak");
    return this.prisma.directMessage.create({
      data: { senderId, receiverId, text: clean },
    });
  }

  async getUserById(actor: { sub: string; role: UserRole; schoolId?: string }, targetId: string, _ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      include: {
        profile: true,
        studentProfile: true,
        teacherProfile: true,
        school: true,
        interestResults: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!user || user.deletedAt) throw new NotFoundException("Foydalanuvchi topilmadi");

    if (actor.sub !== targetId && actor.role !== UserRole.SUPER_ADMIN) {
      if (actor.role === UserRole.TEACHER) {
        const teachesStudent = await this.prisma.enrollment.findFirst({
          where: { studentId: targetId, course: { teacherId: actor.sub } },
        });
        if (!teachesStudent) {
          throw new ForbiddenException("Bu o‘quvchi sizning darsingizga biriktirilmagan. Shaxsiy ma’lumotlar yopiq.");
        }
      } else if (actor.role === UserRole.ADMIN && user.schoolId !== actor.schoolId) {
        throw new ForbiddenException("Ruxsat yo‘q");
      } else if (actor.role === UserRole.STUDENT) {
        throw new ForbiddenException("Shaxsiy ma’lumotlar yopiq");
      }
    }

    const { passwordHash, phoneOtpCode, phoneOtpExp, ...safeUser } = user;
    return safeUser;
  }

  async updateMyProfile(userId: string, body: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, studentProfile: true, teacherProfile: true },
    });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi");

    // Username yangilash (agar kiritilgan bo'lsa)
    let newUsername = user.username;
    if (body.username !== undefined) {
      const cleanU = String(body.username).trim().replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanU.length < 3) {
        throw new BadRequestException("Foydalanuvchi nomi (@username) kamida 3 ta harf/raqamdan iborat bo‘lsin");
      }
      const taken = await this.prisma.user.findFirst({ where: { username: cleanU, id: { not: userId } } });
      if (taken) {
        throw new BadRequestException(`@${cleanU} foydalanuvchi nomi band, boshqasini tanlang`);
      }
      newUsername = cleanU;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
    });

    await this.prisma.profile.upsert({
      where: { userId },
      update: {
        firstName: body.firstName ?? user.profile?.firstName ?? "Ism",
        lastName: body.lastName ?? user.profile?.lastName ?? "Familiya",
        middleName: body.middleName ?? user.profile?.middleName,
        birthDate: body.birthDate ? new Date(body.birthDate) : user.profile?.birthDate,
        gender: body.gender || user.profile?.gender,
        region: body.region ?? user.profile?.region,
        district: body.district ?? user.profile?.district,
        bio: body.bio ?? user.profile?.bio,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : user.profile?.avatarUrl,
      },
      create: {
        userId,
        firstName: body.firstName || "Ism",
        lastName: body.lastName || "Familiya",
        middleName: body.middleName || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        gender: body.gender || null,
        region: body.region || null,
        district: body.district || null,
        bio: body.bio || null,
        avatarUrl: body.avatarUrl || null,
      },
    });

    if (user.role === UserRole.STUDENT) {
      const hasDoc = Boolean(body.studentDocUrl || user.studentProfile?.studentDocUrl);
      await this.prisma.studentProfile.upsert({
        where: { userId },
        update: {
          grade: body.grade || user.studentProfile?.grade || "9-sinf",
          schoolName: body.schoolName !== undefined ? body.schoolName : user.studentProfile?.schoolName,
          region: body.region || user.studentProfile?.region || "Toshkent",
          district: body.district || user.studentProfile?.district || "Markaziy",
          studentDocUrl: body.studentDocUrl !== undefined ? body.studentDocUrl : user.studentProfile?.studentDocUrl,
          isVerified: hasDoc && Boolean(body.schoolName || user.studentProfile?.schoolName),
        },
        create: {
          userId,
          grade: body.grade || "9-sinf",
          schoolName: body.schoolName || null,
          region: body.region || "Toshkent",
          district: body.district || "Markaziy",
          interests: [],
          studentDocUrl: body.studentDocUrl || null,
          isVerified: Boolean(body.studentDocUrl && body.schoolName),
        },
      });
    } else if (user.role === UserRole.TEACHER) {
      const hasDiploma = Boolean(body.diplomaUrl || user.teacherProfile?.diplomaUrl);
      const hasWorkplace = Boolean(body.workplace || user.teacherProfile?.workplace);
      await this.prisma.teacherProfile.upsert({
        where: { userId },
        update: {
          subjects: Array.isArray(body.subjects) ? body.subjects : user.teacherProfile?.subjects || [],
          education: body.education || user.teacherProfile?.education || "Oliy",
          experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : user.teacherProfile?.experienceYears || 0,
          workplace: body.workplace !== undefined ? body.workplace : user.teacherProfile?.workplace,
          diplomaUrl: body.diplomaUrl !== undefined ? body.diplomaUrl : user.teacherProfile?.diplomaUrl,
          isVerified: hasDiploma && hasWorkplace,
        },
        create: {
          userId,
          subjects: Array.isArray(body.subjects) ? body.subjects : [],
          education: body.education || "Oliy",
          experienceYears: Number(body.experienceYears || 0),
          workplace: body.workplace || null,
          diplomaUrl: body.diplomaUrl || null,
          isVerified: hasDiploma && hasWorkplace,
        },
      });
    }

    return this.getUserById({ sub: userId, role: user.role }, userId);
  }

  async sendPhoneOtp(userId: string, rawPhone: string) {
    const phone = String(rawPhone || "").replace(/\s+/g, "").trim();
    if (!phone || phone.length < 9) throw new BadRequestException("Telefon raqamini to‘liq kiriting");
    const existing = await this.prisma.user.findFirst({ where: { phone, id: { not: userId } } });
    if (existing) throw new BadRequestException("Bu telefon raqami boshqa akkauntga ulangan");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.prisma.user.update({
      where: { id: userId },
      data: { phone, phoneVerified: false, phoneOtpCode: code, phoneOtpExp: new Date(Date.now() + 5 * 60 * 1000) },
    });
    return { message: `${phone} raqamiga tasdiqlash kodi yuborildi`, demoCode: code };
  }

  async verifyPhoneOtp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.phoneOtpCode || !user.phoneOtpExp) throw new BadRequestException("Avval kod so‘rang");
    if (user.phoneOtpExp < new Date()) throw new BadRequestException("Kod muddati tugagan");
    if (user.phoneOtpCode !== String(code).trim()) throw new BadRequestException("Kod noto‘g‘ri");

    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, phoneOtpCode: null, phoneOtpExp: null },
    });
    return { message: "Telefon raqamingiz tasdiqlandi!", phoneVerified: true };
  }

  async exportStudentsCsv(actor: { sub: string; role: UserRole; schoolId?: string }) {
    const users = await this.listUsers(actor, UserRole.STUDENT);
    const header = "Unikal_ID,Username,Ism,Familiya,Email,Telefon,Sinf";
    const rows = users.map((u) =>
      [u.publicId || "", u.username || "", u.profile?.firstName || "", u.profile?.lastName || "", u.email, u.phone || "", u.studentProfile?.grade || ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    return [header, ...rows].join("\n");
  }
}