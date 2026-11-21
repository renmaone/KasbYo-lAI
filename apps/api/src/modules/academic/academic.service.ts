import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CourseStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  listSchools() {
    return this.prisma.school.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  }

  createSchool(data: { name: string; region: string; district: string; address?: string }) {
    return this.prisma.school.create({ data });
  }

  listClasses(actor: { role: UserRole; schoolId?: string }) {
    const where = actor.role === UserRole.SUPER_ADMIN ? { deletedAt: null } : { schoolId: actor.schoolId, deletedAt: null };
    return this.prisma.class.findMany({
      where,
      include: { homeroomTeacher: { include: { profile: true } }, _count: { select: { memberships: true } } },
    });
  }

  createClass(actor: { role: UserRole; schoolId?: string }, data: { name: string; academicYear: string; schoolId?: string }) {
    const schoolId = actor.role === UserRole.SUPER_ADMIN && data.schoolId ? data.schoolId : actor.schoolId!;
    return this.prisma.class.create({
      data: { name: data.name, academicYear: data.academicYear, schoolId },
    });
  }

  // Sinflar (Courses) ro'yxati: O'qituvchi o'zi yaratgan sinflarni, O'quvchi esa o'zi qo'shilgan sinflarni ko'radi
  listCourses(actor: { sub: string; role: UserRole; schoolId?: string }) {
    const where: any = { deletedAt: null };
    if (actor.role === UserRole.STUDENT) {
      where.enrollments = { some: { studentId: actor.sub } };
    } else if (actor.role === UserRole.TEACHER) {
      where.teacherId = actor.sub;
    }

    return this.prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            publicId: true,
            username: true,
            email: true,
            profile: true,
            teacherProfile: true,
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                publicId: true,
                username: true,
                email: true,
                phone: true,
                phoneVerified: true,
                profile: true,
                studentProfile: true,
                interestResults: { orderBy: { createdAt: "desc" }, take: 1 },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        sections: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createCourse(
    actor: { sub: string; role: UserRole; schoolId?: string },
    data: { title: string; description: string; coverUrl?: string; classId?: string; teacherId?: string },
  ) {
    if (!data.title?.trim()) {
      throw new BadRequestException("Sinf va fan nomini kiriting");
    }
    let schoolId = actor.schoolId;
    if (!schoolId) {
      const firstSchool = await this.prisma.school.findFirst({ where: { deletedAt: null } });
      schoolId = firstSchool?.id;
    }
    if (!schoolId) {
      const created = await this.prisma.school.create({
        data: { name: "KasbYo‘l Akademiyasi", region: "Toshkent", district: "Markaziy" },
      });
      schoolId = created.id;
    }

    return this.prisma.course.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || "Fan bo‘yicha amaliy va nazariy mashg‘ulotlar",
        coverUrl: data.coverUrl || null,
        schoolId,
        classId: data.classId,
        teacherId: actor.sub,
        isPublic: false,
        status: CourseStatus.PUBLISHED,
      },
    });
  }

  enrollCourse(courseId: string, studentId: string) {
    return this.prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId, studentId } },
      update: { status: "ACTIVE" },
      create: { courseId, studentId },
    });
  }

  // Faqat sinfni yaratgan o'qituvchi o'quvchini ID orqali topib sinfga qo'shadi
  async enrollStudentByPublicId(
    actor: { sub: string; role: UserRole },
    courseId: string,
    rawPublicId: string,
  ) {
    const query = String(rawPublicId || "").trim();
    if (!query) {
      throw new BadRequestException("O‘quvchi ID raqamini kiriting (masalan: KY-1001)");
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) {
      throw new NotFoundException("Sinf topilmadi");
    }

    if (course.teacherId !== actor.sub && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Faqat ushbu sinfni yaratgan o‘qituvchi o‘quvchi qo‘sha oladi");
    }

    const cleanUsername = query.replace(/^@/, "").toLowerCase();
    const student = await this.prisma.user.findFirst({
      where: {
        role: UserRole.STUDENT,
        deletedAt: null,
        OR: [
          { publicId: { equals: query.toUpperCase(), mode: "insensitive" } },
          { username: { equals: cleanUsername, mode: "insensitive" } },
          { id: query },
        ],
      },
      include: { profile: true, studentProfile: true },
    });

    if (!student) {
      throw new NotFoundException(`"${query}" ID raqamli o‘quvchi topilmadi. O‘quvchi ro‘yxatdan o‘tganligini tekshiring.`);
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId, studentId: student.id } },
      update: { status: "ACTIVE" },
      create: { courseId, studentId: student.id, status: "ACTIVE" },
    });

    return {
      message: `${student.profile?.firstName} ${student.profile?.lastName} (${student.publicId}) sinfga muvaffaqiyatli qo‘shildi!`,
      enrollment,
    };
  }

  async removeStudentFromCourse(actor: { sub: string; role: UserRole }, courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Sinf topilmadi");
    if (course.teacherId !== actor.sub && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Faqat sinfni yaratgan o‘qituvchi o‘quvchini chiqara oladi");
    }
    await this.prisma.enrollment.deleteMany({ where: { courseId, studentId } });
    return { message: "O‘quvchi sinfdan chiqarildi" };
  }

  completeLesson(lessonId: string, studentId: string) {
    return this.prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId, studentId } },
      update: { completed: true, completedAt: new Date() },
      create: { lessonId, studentId, completed: true, completedAt: new Date() },
    });
  }

  createAssignment(courseId: string, data: { title: string; description: string; dueDate: string; maxScore?: number }) {
    return this.prisma.assignment.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxScore: data.maxScore ?? 100,
      },
    });
  }

  submitAssignment(assignmentId: string, studentId: string, textAnswer: string) {
    return this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: { textAnswer, submittedAt: new Date() },
      create: { assignmentId, studentId, textAnswer },
    });
  }

  gradeSubmission(submissionId: string, score: number, feedback: string) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { score, feedback, gradedAt: new Date() },
    });
  }

  async getDashboardStats(actor: { sub: string; role: UserRole; schoolId?: string }) {
    const [studentsCount, teachersCount, coursesCount, classesCount] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.STUDENT, deletedAt: null } }),
      this.prisma.user.count({ where: { role: UserRole.TEACHER, deletedAt: null } }),
      this.prisma.course.count({ where: { ...(actor.role === UserRole.TEACHER ? { teacherId: actor.sub } : {}), deletedAt: null } }),
      this.prisma.class.count({ where: { deletedAt: null } }),
    ]);
    return { studentsCount, teachersCount, coursesCount, classesCount };
  }

  async getLessons(courseId: string, actor: { sub: string; role: UserRole }) {
    const isTeacher = actor.role === UserRole.TEACHER || actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    const sections = await this.prisma.section.findMany({
      where: { courseId },
      include: {
        lessons: { orderBy: { position: "asc" } },
      },
      orderBy: { position: "asc" },
    });

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: isTeacher
          ? {
              include: {
                student: { select: { id: true, publicId: true, username: true, profile: true } },
              },
              orderBy: { submittedAt: "desc" },
            }
          : { where: { studentId: actor.sub } },
      },
      orderBy: { createdAt: "asc" },
    });

    const flatLessons = sections.flatMap((s: any) => s.lessons);
    return flatLessons.map((lesson: any, idx: number) => {
      const matchedAssignment = assignments.find((a) => a.title === `Vazifa: ${lesson.title}`) || assignments[idx];
      return {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        homework: matchedAssignment?.description || null,
        assignmentId: matchedAssignment?.id || null,
        submissions: matchedAssignment?.submissions || [],
      };
    });
  }

  async createLesson(
    courseId: string,
    actor: { sub: string; role: UserRole },
    body: { title: string; content: string; videoUrl?: string; homework?: string },
  ) {
    if (!body.title?.trim() || !body.content?.trim()) {
      throw new BadRequestException("Dars mavzusi va matnini kiriting");
    }

    let section = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { position: "asc" },
    });

    if (!section) {
      section = await this.prisma.section.create({
        data: { courseId, title: "Asosiy bo‘lim", position: 1 },
      });
    }

    const existingCount = await this.prisma.lesson.count({ where: { sectionId: section.id } });
    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId: section.id,
        title: body.title.trim(),
        content: body.content.trim(),
        videoUrl: body.videoUrl?.trim() || null,
        position: existingCount + 1,
      },
    });

    if (body.homework?.trim()) {
      await this.prisma.assignment.create({
        data: {
          courseId,
          title: `Vazifa: ${body.title.trim()}`,
          description: body.homework.trim(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxScore: 100,
        },
      });
    }

    return lesson;
  }

  async submitHomework(lessonId: string, studentId: string, answerText: string) {
    if (!answerText?.trim()) throw new BadRequestException("Vazifa javobini yozing");

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });
    if (!lesson) throw new NotFoundException("Dars topilmadi");

    let assignment = await this.prisma.assignment.findFirst({
      where: { courseId: lesson.section.courseId, title: `Vazifa: ${lesson.title}` },
    });

    if (!assignment) {
      assignment = await this.prisma.assignment.create({
        data: {
          courseId: lesson.section.courseId,
          title: `Vazifa: ${lesson.title}`,
          description: "Dars bo‘yicha topshiriq",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxScore: 100,
        },
      });
    }

    return this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId } },
      update: { textAnswer: answerText.trim(), submittedAt: new Date() },
      create: { assignmentId: assignment.id, studentId, textAnswer: answerText.trim() },
    });
  }
}