import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Display name. Trimmed before saving; must not be blank.',
    example: 'Manish',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Unique email address. Normalized to lowercase.',
    example: 'manish@example.com',
    format: 'email',
    maxLength: 254,
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Password containing 12–128 characters.',
    example: 'LearningNest123!',
    format: 'password',
    minLength: 12,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}