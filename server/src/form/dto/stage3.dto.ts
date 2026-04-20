import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';


export class Stage3Dto {
  @ApiProperty({ description: 'Form being updated' })
  @IsMongoId({ message: 'formId must be a valid ObjectId' })
  formId!: string;

  @ApiProperty({ example: 'Acme Technologies Pvt. Ltd.' })
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName!: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  jobTitle!: string;

  @ApiProperty({ example: 5, minimum: 0, maximum: 60 })
  @Type(() => Number)          // convert multipart string → number
  @IsInt({ message: 'Years of experience must be a whole number' })
  @Min(0,  { message: 'Years of experience cannot be negative' })
  @Max(60, { message: 'Years of experience cannot exceed 60' })
  yearsOfExperience!: number;

  @ApiPropertyOptional({
    example: ['TypeScript', 'NestJS', 'React'],
    description: 'Repeated fields or comma-separated string both accepted',
    type:    [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each skill must be a string' })
  @MaxLength(60, { each: true, message: 'Each skill must not exceed 60 characters' })
  @Transform(({ value }) => {
    if (!value) return [];
    // Handle comma-separated string from some clients
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    // Handle already-parsed array
    if (Array.isArray(value)) {
      return value.map((s: string) => String(s).trim()).filter(Boolean);
    }
    return [];
  })
  skills?: string[];

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/janedoe' })
  @IsOptional()
  @IsUrl({}, { message: 'linkedinUrl must be a valid URL' })
  linkedinUrl?: string;

  @ApiPropertyOptional({
    example: 'Passionate engineer with focus on scalable systems.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  bio?: string;
}
