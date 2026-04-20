import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum GenderEnum {
  MALE        = 'male',
  FEMALE      = 'female',
  NON_BINARY  = 'non-binary',
  PREFER_NOT  = 'prefer-not-to-say',
}

export class Stage1Dto {
  @ApiPropertyOptional({
    description:
      'Form to update. Omit to create a brand-new draft.',
  })
  @IsOptional()
  @IsMongoId({ message: 'formId must be a valid ObjectId' })
  formId?: string;

  @ApiProperty({ example: 'Jane Marie Doe', description: 'Full legal name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(8,  { message: 'Full name must be at least 8 characters' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @ApiProperty({ example: '9876543210', description: 'Exactly 10 digits' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @ApiPropertyOptional({
    example: '1995-06-15',
    description: 'ISO date string YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'dateOfBirth must be in YYYY-MM-DD format',
  })
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: GenderEnum, example: GenderEnum.FEMALE })
  @IsOptional()
  @IsEnum(GenderEnum, {
    message: `gender must be one of: ${Object.values(GenderEnum).join(', ')}`,
  })
  gender?: GenderEnum;
}
