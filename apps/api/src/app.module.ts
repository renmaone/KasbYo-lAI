import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaService } from "./prisma/prisma.service";
import { AuditService } from "./modules/audit/audit.service";
import { AuditController } from "./modules/audit/audit.controller";
import { AuthService } from "./modules/auth/auth.service";
import { AuthController } from "./modules/auth/auth.controller";
import { UsersService } from "./modules/users/users.service";
import { UsersController } from "./modules/users/users.controller";
import { AcademicService } from "./modules/academic/academic.service";
import { AcademicController } from "./modules/academic/academic.controller";
import { CareerService } from "./modules/career/career.service";
import { AiMentorService } from "./modules/career/ai-mentor.service";
import { CareerController } from "./modules/career/career.controller";
import { HealthController } from "./modules/health/health.controller";

@Module({
  imports: [
    JwtModule.register({ global: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [
    AuthController,
    UsersController,
    AcademicController,
    CareerController,
    AuditController,
    HealthController,
  ],
  providers: [
    PrismaService,
    AuditService,
    AuthService,
    UsersService,
    AcademicService,
    CareerService,
    AiMentorService,
  ],
})
export class AppModule {}
