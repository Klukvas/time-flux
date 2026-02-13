import { Body, Controller, Get, Logger, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard.js';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import type { GoogleProfile } from './strategies/google.strategy.js';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error (e.g. email already taken)' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('google')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description: 'Redirects the user to Google consent screen. After authorization, Google redirects back to /api/v1/auth/google/callback.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  googleAuth() {
    // Guard handles the redirect to Google
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const profile = req.user as GoogleProfile | undefined;
    if (!profile) {
      res.redirect(`${this.frontendUrl}/auth/google/callback?error=GOOGLE_AUTH_FAILED`);
      return;
    }
    try {
      const result = await this.authService.googleLogin(profile);
      const params = new URLSearchParams({
        token: result.access_token,
        refresh_token: result.refresh_token,
        user: JSON.stringify(result.user),
      });
      res.redirect(`${this.frontendUrl}/auth/google/callback?${params.toString()}`);
    } catch (error) {
      this.logger.error('Google callback failed', error);
      res.redirect(`${this.frontendUrl}/auth/google/callback?error=GOOGLE_AUTH_FAILED`);
    }
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refresh_token);
  }

  @Patch('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  @ApiResponse({ status: 200, description: 'Onboarding marked as completed', type: AuthUserDto })
  async completeOnboarding(@CurrentUser() user: JwtPayload): Promise<AuthUserDto> {
    return this.authService.completeOnboarding(user.sub);
  }
}
