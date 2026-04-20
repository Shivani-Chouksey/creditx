import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


export class Stage4Dto {
  @ApiProperty({ description: 'Form being updated' })
  @IsMongoId({ message: 'formId must be a valid ObjectId' })
  formId!: string;

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
