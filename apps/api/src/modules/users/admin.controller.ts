import { Body, Controller, ForbiddenException, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureAdmin(userId: string) {
    const user: any = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      throw new ForbiddenException("Faqat Super Admin uchun ruxsat berilgan");
    }
    return user;
  }

  @Get("overview")
  async getOverview(@Req() req: any) {
    await this.ensureAdmin(req.user.sub);
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: true },
    });
    const coursesCount = await this.prisma.course.count();
    const lessonsCount = await (this.prisma as any).lesson?.count().catch(() => 0);

    return {
      stats: {
        totalUsers: users.length,
        students: users.filter((u: any) => u.role === "STUDENT").length,
        teachers: users.filter((u: any) => u.role === "TEACHER").length,
        courses: coursesCount,
        lessons: lessonsCount || 0,
      },
      users: users.map((u: any) => ({
        id: u.id,
        publicId: u.publicId,
        username: u.username,
        email: u.email,
        role: u.role,
        verified: u.verified || false,
        createdAt: u.createdAt,
        profile: u.profile,
      })),
    };
  }

  @Patch("users/:id/verify")
  async verifyUser(@Req() req: any, @Param("id") targetId: string, @Body() body: { verified?: boolean; role?: string }) {
    await this.ensureAdmin(req.user.sub);
    const data: any = {};
    if (typeof body.verified === "boolean") data.verified = body.verified;
    if (body.role) data.role = body.role;

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data,
    });
    return { message: "Foydalanuvchi holati yangilandi", user: updated };
  }
}
