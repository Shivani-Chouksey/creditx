
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


export class Stage2Dto {
  @ApiProperty({ description: 'Form being updated' })
  @IsMongoId({ message: 'formId must be a valid ObjectId' })
  formId!: string;

  @ApiProperty({ example: '42 Marine Drive', description: 'Primary street address' })
  @IsString()
  @IsNotEmpty({ message: 'Street address is required' })
  @MaxLength(250, { message: 'Street must not exceed 250 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  street!: string;

  @ApiPropertyOptional({ example: 'Suite 5B', description: 'Apartment, floor, suite etc.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city!: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty({ message: 'State / province is required' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  state!: string;

  @ApiProperty({ example: '400001', description: 'ZIP / postal code' })
  @IsString()
  @IsNotEmpty({ message: 'Postal code is required' })
  @MinLength(3,  { message: 'Postal code must be at least 3 characters' })
  @MaxLength(20, { message: 'Postal code must not exceed 20 characters' })
  @Matches(/^[A-Za-z0-9\s\-]+$/, {
    message: 'Postal code may only contain letters, numbers, spaces, and hyphens',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  postalCode!: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country!: string;
}
