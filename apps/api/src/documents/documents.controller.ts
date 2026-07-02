import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { createDocumentSchema } from "@cx/shared";
import { JwtAuthGuard } from "../auth/auth.guard";
import { DocumentsService } from "./documents.service";

@ApiTags("documents")
@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@Req() req: Request & { user: { id: string } }) {
    return this.documentsService.list(req.user.id);
  }

  @Get(":id")
  get(@Param("id") id: string, @Req() req: Request & { user: { id: string } }) {
    return this.documentsService.get(id, req.user.id);
  }

  @Get(":id/status")
  status(@Param("id") id: string, @Req() req: Request & { user: { id: string } }) {
    return this.documentsService.getStatus(id, req.user.id);
  }

  @Post()
  create(@Body() body: unknown, @Req() req: Request & { user: { id: string } }) {
    const input = createDocumentSchema.parse(body);
    return this.documentsService.createFromInput(req.user.id, input);
  }

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documentsService.uploadPdf(req.user.id, file);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request & { user: { id: string } }) {
    return this.documentsService.remove(id, req.user.id);
  }
}
