import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { UsersService } from "./users.service";

describe("UsersService Tenant Isolation", () => {
  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const mockAudit: any = { log: jest.fn() };
  const service = new UsersService(mockPrisma, mockAudit);

  it("denies ADMIN from accessing student data of another school", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "student-other",
      schoolId: "school-999",
      deletedAt: null,
    });

    await expect(
      service.getUserById(
        { sub: "admin-1", role: UserRole.ADMIN, schoolId: "school-110" },
        "student-other",
        "127.0.0.1",
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("allows SUPER_ADMIN to access any school user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "student-other",
      email: "test@kasbyol.uz",
      passwordHash: "secret",
      schoolId: "school-999",
      deletedAt: null,
    });

    const res = await service.getUserById(
      { sub: "super-1", role: UserRole.SUPER_ADMIN },
      "student-other",
      "127.0.0.1",
    );
    expect(res.email).toBe("test@kasbyol.uz");
  });
});
