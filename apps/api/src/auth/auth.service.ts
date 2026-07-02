import { Injectable, Inject, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users, type Database } from "@cx/db";
import type { LoginInput, SignupInput } from "@cx/shared";
import { DATABASE } from "../database/database.module";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: SignupInput) {
    const existing = await this.db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existing[0]) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const [user] = await this.db
      .insert(users)
      .values({ email: input.email, passwordHash, name: input.name })
      .returning();

    if (!user) throw new Error("Failed to create user");
    const token = this.jwt.sign({ sub: user.id });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async login(input: LoginInput) {
    const [user] = await this.db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const token = this.jwt.sign({ sub: user.id });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }
}
