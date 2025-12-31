import {
  Controller,
  Patch,
  Body,
  Post,
  Request,
  UseGuards,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UpdateSettingsDto } from '../dtos/update-settings.dto';
import { OnboardingDto } from '../dtos/onboarding.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Get('public/details')
  @ApiOperation({ summary: 'Get user details by email (Public)' })
  @ApiQuery({ name: 'email', required: true, example: 'user@example.com' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        email: 'user@example.com',
        name: 'John Doe',
        isPremium: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        latestSubscription: {
          id: '60d5ecb8b5c9c62b3c7c1b5e',
          status: 'PENDING',
          transactionId: 'txn_123',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Query('email') email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get('subscription-status')
  @ApiOperation({ summary: 'Get user subscription and trial status' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status retrieved successfully',
    schema: {
      example: {
        status: 'TRIAL',
        isPremium: false,
        isTrialActive: true,
        hasAccess: true,
        trialEndsAt: '2026-01-30T10:00:00.000Z',
        nextPaymentDate: null,
        pendingSubscriptionId: '60d5ecb8b5c9c62b3c7c1b5e',
        latestSubscription: {
          id: '60d5ecb8b5c9c62b3c7c1b5e',
          status: 'PENDING',
          transactionId: 'txn_123',
        },
      },
    },
  })
  async getSubscriptionStatus(@Request() req) {
    return this.userService.getSubscriptionStatus(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update name, phone, address' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        email: 'user@example.com',
        name: 'John Doe Updated',
        phone: '+1234567890',
        address: '123 Main St',
      },
    },
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update trackingMode, qazaGoalYears' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        trackingMode: 'DETAILED',
        qazaGoalYears: 5,
      },
    },
  })
  async updateSettings(
    @Request() req,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.userService.updateSettings(req.user.id, updateSettingsDto);
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Save initial onboarding data' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding data saved successfully',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        gender: 'MALE',
        address: 'New York, USA',
      },
    },
  })
  async onboarding(@Request() req, @Body() onboardingDto: OnboardingDto) {
    return this.userService.onboarding(req.user.id, onboardingDto);
  }
}
