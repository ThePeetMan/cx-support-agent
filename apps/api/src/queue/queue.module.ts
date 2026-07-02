import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

export const INGESTION_QUEUE = Symbol("INGESTION_QUEUE");

@Global()
@Module({
  providers: [
    {
      provide: INGESTION_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("REDIS_URL") ?? "redis://localhost:6381";
        return new Queue("document-ingestion", {
          connection: { url, maxRetriesPerRequest: null },
        });
      },
    },
  ],
  exports: [INGESTION_QUEUE],
})
export class QueueModule {}
