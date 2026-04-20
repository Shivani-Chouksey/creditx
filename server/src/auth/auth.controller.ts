import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Cookie options shared by both tokens.
 *
 * - `httpOnly` prevents any JavaScript access.
 * - `secure` follows NODE_ENV so dev over HTTP still works while
 *   production (HTTPS) remains locked down.
 * - `sameSite: 'lax'` is a safe default for first-party SPAs that
 *   still lets OAuth redirects & normal navigation carry cookies.
 */
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_BASE = {
  httpOnly: true,
  secure:   isProd,
  // sameSite:'none' as const,
  sameSite: 'none' as const,
  path:     '/',
};

const ACCESS_MAX_AGE  = 60 * 1000;                  // 1 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;    // 7 days

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /* ─────────── REGISTER ─────────── */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /* ─────────── LOGIN ─────────── */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login success' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);

    // Set BOTH tokens as HTTP-only cookies (spec requires cookie-based
    // auth in addition to Bearer). The access token is also returned
    // in the body so clients may use the Authorization header.
    // res.cookie('accessToken',  result.accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE });
    res.cookie('refreshToken', result.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE });

    return {
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user:        result.user,
      },
    };
  }

  /* ─────────── REFRESH ─────────── */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access + refresh tokens' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.refresh(req);

    // Rotation: set the NEW refresh token back in the cookie so the
    // next request carries a valid one (the old hash is already
    // replaced server-side).
    // res.cookie('accessToken',  result.accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE });
    res.cookie('refreshToken', result.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE });

    return {
      message: 'Token refreshed',
      data: { accessToken: result.accessToken },
    };
  }

  /* ─────────── LOGOUT ─────────── */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sign out — clears cookies and invalidates refresh token' })
  async logout(
    @CurrentUser('userId')       userId: string,
    @Res({ passthrough: true })  res:    Response,
  ) {
    await this.auth.logout(userId);

    res.clearCookie('accessToken',  COOKIE_BASE);
    res.clearCookie('refreshToken', COOKIE_BASE);

    return { message: 'Logged out' };
  }
}
