// import { IsString } from "class-validator";

// export class DocumentDto {
//   @IsString()
//   formId!: string;
// }

import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Stage 4 — Document Upload
 *
 * The actual files are handled by Multer (@UploadedFiles).
 * This DTO carries optional text metadata that can accompany
 * the upload request.
 *
 * File constraints (enforced in multer.config.ts):
 *  - Min files : 2  (ID proof + one more)
 *  - Max files : 5
 *  - Max size  : 10 MB per file
 *  - Allowed   : PDF, JPEG, PNG, DOC, DOCX
 */
export class Stage4Dto {
  @ApiPropertyOptional({
    example: 'Government issued ID and latest pay slip',
    description: 'Optional notes describing the uploaded documents',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}