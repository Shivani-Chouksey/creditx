import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { FormsService } from './form.service';
import { Stage1Dto } from './dto/stage1.dto';
import { Stage2Dto } from './dto/stage2.dto';
import { Stage3Dto } from './dto/stage3.dto';
import { Stage4Dto } from './dto/stage4.dto';
import { Stage5Dto } from './dto/stage5.dto';
import { FormListQueryDto } from './dto/form-list-query.dto';
import { documentMulterConfig } from '../../multer.config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

/**
 * FormsController
 *
 * All routes are protected by JwtAuthGuard.
 * Stages 1–3 and 5 accept multipart/form-data (text parts only) —
 * AnyFilesInterceptor is used so Nest's multer parses the body.
 * Stage 4 uses FilesInterceptor bound to the `documents` field.
 */
@ApiTags('forms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // ───────────────────────────────────────────────────────
  //  READ ENDPOINTS
  // ───────────────────────────────────────────────────────

  @Get('resume')
  @ApiOperation({ summary: 'Get resume info for the current user' })
  getResumeInfo(@CurrentUser('userId') userId: string) {
    return this.formsService.getResumeInfo(userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all forms with pagination' })
  @ApiQuery({ name: 'page',      required: false, type: Number })
  @ApiQuery({ name: 'limit',     required: false, type: Number })
  @ApiQuery({ name: 'status',    required: false, type: String })
  @ApiQuery({ name: 'stage',     required: false, type: Number })
  @ApiQuery({ name: 'sortBy',    required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiQuery({ name: 'search',    required: false, type: String })
  listForms(
    @CurrentUser('userId') userId: string,
    @Query()               query:  FormListQueryDto,
  ) {
    return this.formsService.listForms(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single form by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the form' })
  getFormById(
    @Param('id', ParseObjectIdPipe) formId: string,
    @CurrentUser('userId')          userId: string,
  ) {
    return this.formsService.getFormById(formId, userId);
  }

  // ───────────────────────────────────────────────────────
  //  STAGE ENDPOINTS  (all multipart/form-data)
  // ───────────────────────────────────────────────────────

  @Post('stage-1')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Stage 1 — Save basic information' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: Stage1Dto })
  saveStage1(
    @Body()                dto:    Stage1Dto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.formsService.saveStage1(userId, dto);
  }

  @Post('stage-2')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Stage 2 — Save address details' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: Stage2Dto })
  saveStage2(
    @Body()                dto:    Stage2Dto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.formsService.saveStage2(userId, dto);
  }

  @Post('stage-3')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Stage 3 — Save professional details' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: Stage3Dto })
  saveStage3(
    @Body()                dto:    Stage3Dto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.formsService.saveStage3(userId, dto);
  }

  /**
   * Stage 4: Document Upload — MULTIPART ONLY.
   * Field: "documents" (min 2, max 5, 10 MB each, PDF/JPEG/PNG/DOC/DOCX).
   */
  @Post('stage-4')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('documents', 5, documentMulterConfig))
  @ApiOperation({ summary: 'Stage 4 — Upload documents (multipart only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type:     'object',
      required: ['documents'],
      properties: {
        documents: {
          type:  'array',
          items: { type: 'string', format: 'binary' },
        },
        notes: { type: 'string' },
      },
    },
  })
  saveStage4(
    @UploadedFiles()       files:  Express.Multer.File[],
    @Body()                dto:    Stage4Dto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.formsService.saveStage4(userId, files, dto);
  }

  @Post('stage-5')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Stage 5 — Review and submit the form' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: Stage5Dto })
  saveStage5(
    @Body()                dto:    Stage5Dto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.formsService.saveStage5(userId, dto);
  }

  // ───────────────────────────────────────────────────────
  //  DOCUMENT MANAGEMENT
  // ───────────────────────────────────────────────────────

  @Delete(':id/documents/:index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific uploaded document' })
  @ApiParam({ name: 'id',    description: 'Form ID' })
  @ApiParam({ name: 'index', description: 'Zero-based document index', type: Number })
  removeDocument(
    @Param('id',    ParseObjectIdPipe)            formId:        string,
    @Param('index', ParseIntPipe)                 documentIndex: number,
    @CurrentUser('userId')                        userId:        string,
  ) {
    return this.formsService.removeDocument(formId, documentIndex, userId);
  }
}
