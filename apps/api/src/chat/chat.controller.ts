import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { chatMessageSchema } from "@cx/shared";
import { JwtAuthGuard, WidgetApiKeyGuard } from "../auth/auth.guard";
import { ChatService } from "./chat.service";

@ApiTags("chat")
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("sessions")
  @UseGuards(WidgetApiKeyGuard)
  createSession(@Req() req: Request) {
    return this.chatService.createSession(req.headers["user-agent"] as string | undefined);
  }

  @Post("message")
  @UseGuards(WidgetApiKeyGuard)
  async message(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const input = chatMessageSchema.parse(body);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = this.chatService.streamMessage(input, req.headers["user-agent"] as string | undefined);
    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  listSessions() {
    return this.chatService.listSessions();
  }

  @Get("sessions/:id")
  @UseGuards(JwtAuthGuard)
  getSession(@Param("id") id: string) {
    return this.chatService.getSession(id);
  }

  @Post("sessions/:id/takeover")
  @UseGuards(JwtAuthGuard)
  takeover(@Param("id") id: string) {
    return this.chatService.takeover(id);
  }
}
