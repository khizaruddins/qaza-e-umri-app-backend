import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UpdateSettingsDto } from '../dtos/update-settings.dto';
import { OnboardingDto } from '../dtos/onboarding.dto';

@Injectable()
export class UserService {
  constructor(private databaseService: DatabaseService) {}

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.databaseService.user.update({
      where: { id: userId },
      data: updateProfileDto,
    });
  }

  async updateSettings(userId: string, updateSettingsDto: UpdateSettingsDto) {
    return this.databaseService.user.update({
      where: { id: userId },
      data: updateSettingsDto,
    });
  }

  async onboarding(userId: string, onboardingDto: OnboardingDto) {
    const { gender, location, phone } = onboardingDto;
    return this.databaseService.user.update({
      where: { id: userId },
      data: {
        gender,
        address: location, // Mapping location to address as per schema
        ...(phone && { phone }),
      },
    });
  }

  async findUserByEmail(email: string) {
    const user = await this.databaseService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        createdAt: true,
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return null;

    const { subscriptions, ...userData } = user;
    return {
      ...userData,
      latestSubscription: subscriptions[0] || null,
    };
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        trialStartDate: true,
        createdAt: true,
        nextPaymentDate: true,
      },
    });

    if (!user) return null;

    // Get latest subscription
    const latestSubscription =
      await this.databaseService.subscription.findFirst({
        where: {
          userId: userId,
        },
        orderBy: { createdAt: 'desc' },
      });

    const now = new Date();
    // Fallback to createdAt if trialStartDate is missing (for old users)
    const trialStartDate = user.trialStartDate || user.createdAt;
    const trialEndsAt = new Date(trialStartDate);
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const isTrialActive = now < trialEndsAt;
    const hasAccess = user.isPremium || isTrialActive;

    let status = 'LAPSED';
    if (user.isPremium) {
      status = 'PREMIUM';
    } else if (isTrialActive) {
      status = 'TRIAL';
    }

    return {
      status,
      isPremium: user.isPremium,
      isTrialActive,
      hasAccess,
      trialEndsAt,
      nextPaymentDate: user.nextPaymentDate,
      pendingSubscriptionId:
        latestSubscription?.status === 'PENDING' ? latestSubscription.id : null,
      latestSubscription,
    };
  }
}
