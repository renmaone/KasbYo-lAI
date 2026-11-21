import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    schoolId?: string | null;
    actorId?: string | null;
    action: string;
    entity: string;
    entityId?: string;
    ipAddress?: string;
    metaJson?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        schoolId: params.schoolId ?? null,
        actorId: params.actorId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        ipAddress: params.ipAddress,
        metaJson: params.metaJson ?? {},
      },
    });
  }

  async findAll(user: { role: string; schoolId?: string }) {
    const where = user.role === "SUPER_ADMIN" ? {} : { schoolId: user.schoolId ?? "__none__" };
    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
