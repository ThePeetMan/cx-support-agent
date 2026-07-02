import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("summary")
  summary() {
    return this.analyticsService.summary();
  }
}
