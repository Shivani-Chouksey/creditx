import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Stage 5 — Review & Submit
 *
 * This is the final stage. The service validates that all prior
 * stages have been persisted before marking the form completed.
 * The only user-supplied field is an optional review note.
 */
export class Stage5Dto {
  @ApiPropertyOptional({
    example: 'All information is accurate as of today.',
    description: 'Optional notes added by the applicant before submission',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Review notes must not exceed 1000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reviewNotes?: string;
}