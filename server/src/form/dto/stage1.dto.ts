
// export class BasicInfoDto {
//   @IsString()
//   @MinLength(2)
//   firstName!: string;

//   @IsString()
//   @MinLength(2)
//   lastName!: string;

//   @IsEmail()
//   email!: string;

//   @IsString()
//   phone!: string;
// }

import {
  IsEmail,
  IsEnum,
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

/**
 * Stage 1 — Basic Information
 *
 * Accepted as multipart/form-data (text fields only at this stage).
 * All string values are trimmed via @Transform before validation runs.
 */
export class Stage1Dto {
  @ApiProperty({ example: 'Jane Doe', description: 'Full legal name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2,  { message: 'Full name must be at least 2 characters' })
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

  @ApiProperty({ example: '+919876543210', description: 'E.164 format preferred' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message:
      'Enter a valid phone number (7–15 digits, optional leading +)',
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