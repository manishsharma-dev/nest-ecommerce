import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  AuthErrorResponseDto,
  LoginResponseDto,
  TokenResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import type { AuthenticatedRequest } from './guards/access-token.guard.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register an account',
    description:
      'Creates a user with a hashed password. Does not issue tokens; log in afterward.',
  })
  @ApiCreatedResponse({
    description: 'Account created.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input, unexpected fields, or a blank name.',
    type: AuthErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email is already registered.',
    type: AuthErrorResponseDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in',
    description:
      'Issues access and refresh tokens. Each login creates a separate session family.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid input or unexpected fields.',
    type: AuthErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
    type: AuthErrorResponseDto,
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated user’s profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token, or user no longer exists.',
    type: AuthErrorResponseDto,
  })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate a refresh token',
    description:
      'Exchanges an active refresh token for replacement tokens. ' +
      'The supplied refresh token becomes unusable. Session expiry is unchanged. ' +
      'Clients should send only one refresh request at a time.',
  })
  @ApiOkResponse({ type: TokenResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid refresh-token format or unexpected fields.',
    type: AuthErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unknown, expired, or revoked refresh token.',
    type: AuthErrorResponseDto,
  })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Log out one session family',
    description:
      'Revokes the family associated with the supplied refresh token, including ' +
      'its rotated replacements. Repeated requests are safe. ' +
      'Existing access tokens remain valid until expiry.',
  })
  @ApiNoContentResponse({
    description: 'Logout completed. No response body.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid refresh-token format or unexpected fields.',
    type: AuthErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The session owner no longer exists.',
    type: AuthErrorResponseDto,
  })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Log out all sessions',
    description:
      'Revokes all current refresh sessions for the authenticated user. ' +
      'Existing access tokens remain valid until expiry. No request body is needed.',
  })
  @ApiNoContentResponse({
    description: 'All current refresh sessions revoked. No response body.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token, or user no longer exists.',
    type: AuthErrorResponseDto,
  })
  async logoutAll(
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.authService.logoutAll(request.userId);
  }
}