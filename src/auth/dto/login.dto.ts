import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address. Normalized to lowercase.',
    example: 'manish@example.com',
    format: 'email',
    maxLength: 254,
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'LearningNest123!',
    format: 'password',
    minLength: 1,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}