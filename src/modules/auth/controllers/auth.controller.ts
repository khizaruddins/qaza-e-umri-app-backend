import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dtos/signup.dto';
import { LoginDto } from '../dtos/login.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        user: {
          id: '60d5ecb8b5c9c62b3c7c1b5e',
          email: 'user@example.com',
          name: 'John Doe',
        },
      },
    },
  })
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.signup(signupDto);

    this.setCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    schema: {
      example: {
        user: {
          id: '60d5ecb8b5c9c62b3c7c1b5e',
          email: 'user@example.com',
          name: 'John Doe',
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);

    this.setCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    schema: {
      example: {
        user: {
          id: '60d5ecb8b5c9c62b3c7c1b5e',
          email: 'user@example.com',
          name: 'John Doe',
        },
      },
    },
  })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    } = await this.authService.refresh(refreshToken);

    this.setCookies(res, accessToken, newRefreshToken);

    return { user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        email: 'user@example.com',
        name: 'John Doe',
        gender: 'MALE',
        isPremium: false,
        qazaGoalYears: 2,
        trackingMode: 'CHECKLIST',
      },
    },
  })
  async getProfile(@Request() req) {
    return req.user;
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    if (res && typeof res.cookie === 'function') {
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    } else {
      console.warn('Response object or cookie method not available');
    }
  }
}
