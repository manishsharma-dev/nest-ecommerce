import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description:
      'The latest refresh token returned by login or refresh. ' +
      'For logout, a previously rotated token can revoke its session family.',
    example: 'a'.repeat(64),
    minLength: 64,
    maxLength: 64,
    pattern: '^[a-f0-9]{64}$',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'refreshToken must be a 64-character hexadecimal string',
  })
  refreshToken!: string;
}