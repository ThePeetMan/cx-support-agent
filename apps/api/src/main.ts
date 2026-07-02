import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT ?? 3001;
  const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",");

  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigins.map((o) => o.trim()),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("CX Support Agent API")
    .setDescription("AI customer support platform API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "widget-key")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
