import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { users, type Database } from "@cx/db";
import { DATABASE } from "../database/database.module";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.access_token ?? req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException("Missing auth token");

    try {
      const payload = this.jwt.verify<{ sub: string }>(token);
      const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      if (!user) throw new UnauthorizedException("Invalid user");
      (req as Request & { user: typeof user }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid auth token");
    }
  }
}

@Injectable()
export class WidgetApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = req.headers["x-api-key"];
    const expected = this.config.get<string>("WIDGET_API_KEY");
    if (!expected || apiKey !== expected) {
      throw new UnauthorizedException("Invalid widget API key");
    }
    return true;
  }
}
