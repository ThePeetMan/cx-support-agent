import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "@cx/shared";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = signupSchema.parse(body);
    const result = await this.authService.signup(input);
    this.setAuthCookie(res, result.token);
    return { user: result.user, token: result.token };
  }

  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = loginSchema.parse(body);
    const result = await this.authService.login(input);
    this.setAuthCookie(res, result.token);
    return { user: result.user, token: result.token };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token", { path: "/" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: { id: string; email: string; name: string } }) {
    return { user: req.user };
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
}
