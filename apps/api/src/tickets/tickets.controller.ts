import { Controller, Get, Param, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { TicketsService } from "./tickets.service";

@ApiTags("tickets")
@Controller("tickets")
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list() {
    return this.ticketsService.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.ticketsService.get(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: { status?: string; priority?: string }) {
    return this.ticketsService.update(id, body);
  }
}
