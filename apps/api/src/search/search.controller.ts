import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { searchQuerySchema } from "@cx/shared";
import { searchKnowledgeBase } from "@cx/ai";
import { Inject } from "@nestjs/common";
import type { Database } from "@cx/db";
import { JwtAuthGuard } from "../auth/auth.guard";
import { DATABASE } from "../database/database.module";

@ApiTags("search")
@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Post()
  async search(@Body() body: unknown) {
    const input = searchQuerySchema.parse(body);
    const results = await searchKnowledgeBase(this.db, input.query, input.limit);
    return { results };
  }
}
