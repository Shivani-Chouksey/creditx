import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'shivani' })
  @IsString()
  firstName!: string

  @ApiProperty({ example: 'chouksey' })
  @IsString()
  lastName!: string

  @ApiProperty({ example: 'shivani@gmail.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'Password@123' })
  @MinLength(6)
  password!: string
}