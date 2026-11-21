import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@Req() req: any) {
    return this.usersService.getUserById(req.user, req.user.sub);
  }

  @Patch("me")
  updateMe(@Req() req: any, @Body() body: any) {
    return this.usersService.updateMyProfile(req.user.sub, body);
  }

  @Post("me/phone/send-otp")
  sendOtp(@Req() req: any, @Body() body: { phone: string }) {
    return this.usersService.sendPhoneOtp(req.user.sub, body.phone);
  }

  @Post("me/phone/verify-otp")
  verifyOtp(@Req() req: any, @Body() body: { code: string }) {
    return this.usersService.verifyPhoneOtp(req.user.sub, body.code);
  }

  @Get("search-students")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  searchStudents(@Query("q") q?: string) {
    return this.usersService.searchStudentsByIdOrName(q || "");
  }

  @Get("chat/search")
  searchChatUsers(@Req() req: any, @Query("q") q?: string) {
    return this.usersService.searchForChat(req.user.sub, q || "");
  }

  @Get("chat/conversations")
  getConversations(@Req() req: any) {
    return this.usersService.getChatConversations(req.user.sub);
  }

  @Get("chat/messages/:peerId")
  getMessages(@Req() req: any, @Param("peerId") peerId: string) {
    return this.usersService.getMessagesWithPeer(req.user.sub, peerId);
  }

  @Post("chat/messages/:peerId")
  sendMessage(@Req() req: any, @Param("peerId") peerId: string, @Body() body: { text: string }) {
    return this.usersService.sendMessageToPeer(req.user.sub, peerId, body.text);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  list(@Req() req: any, @Query("role") role?: UserRole) {
    return this.usersService.listUsers(req.user, role);
  }

  @Get("export/csv")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Header("Content-Type", "text/csv; charset=utf-8")
  exportCsv(@Req() req: any) {
    return this.usersService.exportStudentsCsv(req.user);
  }

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  getOne(@Req() req: any, @Param("id") id: string) {
    return this.usersService.getUserById(req.user, id);
  }
}