import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response, Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async register(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(body, req.ip || "0.0.0.0");
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { message: result.message, accessToken: result.accessToken, user: result.user };
  }

  @Get("google/start")
  googleStart(@Query("role") role: string, @Res() res: Response) {
    const url = this.authService.getGoogleAuthUrl(role === "TEACHER" ? "TEACHER" : "STUDENT");
    return res.redirect(url);
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") oauthError: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    if (oauthError || !code) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(oauthError || "Google bekor qilindi")}`);
    }
    try {
      const result = await this.authService.handleGoogleCallback(code, state, req.ip || "127.0.0.1");
      res.cookie("kasbyol_refresh_token", result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      const userJson = encodeURIComponent(JSON.stringify(result.user));
      return res.redirect(`${frontendUrl}/login?token=${encodeURIComponent(result.accessToken)}&user=${userJson}`);
    } catch (err: any) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || "Google kirish xatosi")}`);
    }
  }

  @Post("google")
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async googleLogin(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleAuth(body, req.ip || "0.0.0.0");
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: { identifier: string }) {
    return this.authService.requestPasswordReset(body.identifier);
  }

  @Post("reset-password")
  resetPassword(@Body() body: { identifier: string; code: string; newPassword: string }) {
    return this.authService.confirmPasswordReset(body.identifier, body.code, body.newPassword);
  }

  @Post("login")
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body, req.ip || "0.0.0.0");
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.refresh(req.cookies?.refresh_token, req.ip || "0.0.0.0");
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.clearCookie("refresh_token");
    return this.authService.logout(req.cookies?.refresh_token);
  }
}