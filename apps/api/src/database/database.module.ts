import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb, type Database } from "@cx/db";

export const DATABASE = Symbol("DATABASE");

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const url = config.get<string>("DATABASE_URL");
        if (!url) throw new Error("DATABASE_URL is required");
        return createDb(url);
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
