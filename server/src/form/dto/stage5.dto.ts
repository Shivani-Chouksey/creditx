import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class Stage5Dto {
  @ApiProperty({ description: 'Form being submitted' })
  @IsMongoId({ message: 'formId must be a valid ObjectId' })
  formId!: string;

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
