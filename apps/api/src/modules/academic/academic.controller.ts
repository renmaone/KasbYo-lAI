import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AcademicService } from "./academic.service";

@ApiTags("Academic")
@Controller()
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get("schools")
  getSchools() {
    return this.academicService.listSchools();
  }

  @Post("schools")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  createSchool(@Body() body: { name: string; region: string; district: string; address?: string }) {
    return this.academicService.createSchool(body);
  }

  @Get("classes")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  getClasses(@Req() req: any) {
    return this.academicService.listClasses(req.user);
  }

  @Post("classes")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  createClass(@Req() req: any, @Body() body: { name: string; academicYear: string; schoolId?: string }) {
    return this.academicService.createClass(req.user, body);
  }

  @Get("courses")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getCourses(@Req() req: any) {
    return this.academicService.listCourses(req.user);
  }

  @Post("courses")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  createCourse(@Req() req: any, @Body() body: any) {
    return this.academicService.createCourse(req.user, body);
  }

  @Post("courses/:id/enroll-by-id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  enrollById(@Param("id") id: string, @Req() req: any, @Body() body: { publicId: string }) {
    return this.academicService.enrollStudentByPublicId(req.user, id, body.publicId);
  }

  @Delete("courses/:id/students/:studentId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  removeStudent(@Param("id") id: string, @Param("studentId") studentId: string, @Req() req: any) {
    return this.academicService.removeStudentFromCourse(req.user, id, studentId);
  }

  @Post("courses/:id/enroll")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  enroll(@Param("id") id: string, @Req() req: any) {
    return this.academicService.enrollCourse(id, req.user.sub);
  }

  @Post("lessons/:id/complete")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  completeLesson(@Param("id") id: string, @Req() req: any) {
    return this.academicService.completeLesson(id, req.user.sub);
  }

  @Post("courses/:id/assignments")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  createAssignment(@Param("id") id: string, @Body() body: any) {
    return this.academicService.createAssignment(id, body);
  }

  @Post("assignments/:id/submit")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  submitAssignment(@Param("id") id: string, @Req() req: any, @Body() body: { textAnswer: string }) {
    return this.academicService.submitAssignment(id, req.user.sub, body.textAnswer);
  }

  @Patch("submissions/:id/grade")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  gradeSubmission(@Param("id") id: string, @Body() body: { score: number; feedback: string }) {
    return this.academicService.gradeSubmission(id, body.score, body.feedback);
  }

  @Get("admin/dashboard-stats")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  getStats(@Req() req: any) {
    return this.academicService.getDashboardStats(req.user);
  }

  @Get("courses/:id/lessons")
  getLessons(@Param("id") courseId: string, @Req() req: any) {
    return this.academicService.getLessons(courseId, req.user);
  }

  @Post("courses/:id/lessons")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  createLesson(
    @Param("id") courseId: string,
    @Req() req: any,
    @Body() body: { title: string; content: string; videoUrl?: string; homework?: string },
  ) {
    return this.academicService.createLesson(courseId, req.user, body);
  }

  @Post("courses/lessons/:lessonId/submit")
  submitHomework(
    @Param("lessonId") lessonId: string,
    @Req() req: any,
    @Body() body: { answerText: string },
  ) {
    return this.academicService.submitHomework(lessonId, req.user.sub, body.answerText);
  }

  @Post("courses/submissions/:submissionId/grade")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  gradeClassroomSubmission(
    @Param("submissionId") submissionId: string,
    @Body() body: { score: number; feedback?: string },
  ) {
    return this.academicService.gradeSubmission(submissionId, Number(body.score), body.feedback || "");
  }
}