import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({ example: 'Manish' })
  name!: string;

  @ApiProperty({
    format: 'email',
    example: 'manish@example.com',
  })
  email!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-04T10:00:00.000Z',
  })
  createdAt!: Date;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token. Send as Authorization: Bearer <token>.',
  })
  accessToken!: string;

  @ApiProperty({
    description:
      'Refresh token. Replace your stored token after every successful refresh.',
    minLength: 64,
    maxLength: 64,
  })
  refreshToken!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'Absolute session expiry. Rotation preserves this original expiry.',
  })
  refreshTokenExpiresAt!: Date;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({
    example: 900,
    description: 'Access-token lifetime in seconds.',
  })
  expiresIn!: number;
}

export class LoginResponseDto extends TokenResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;
}

export class AuthErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
    description:
      'A message string, or an array of messages for validation failures.',
    example: ['password must be longer than or equal to 12 characters'],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}