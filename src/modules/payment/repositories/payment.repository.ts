import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { Prisma, Subscription, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async createSubscription(
    data: Prisma.SubscriptionCreateInput,
  ): Promise<Subscription> {
    return this.prisma.subscription.create({
      data,
    });
  }

  async findSubscriptionById(id: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
    });
  }

  async updateSubscriptionStatus(
    id: string,
    status: PaymentStatus,
    transactionId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status,
        transactionId,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      },
    });
  }

  async findLatestSubscriptionByUserId(
    userId: string,
  ): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestSubscriptionByUserIdPending(
    userId: string,
  ): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: { userId, status: PaymentStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserPremiumStatus(
    userId: string,
    isPremium: boolean,
    paymentDate: Date,
    nextPaymentDate: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium,
        paymentDate,
        nextPaymentDate,
      },
    });
  }

  async findUsersDueForPayment(date: Date): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.user.findMany({
      where: {
        nextPaymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isPremium: true,
      },
    });
  }

  async findUsersDueForTrialExpiry(date: Date): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.user.findMany({
      where: {
        trialStartDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isPremium: false,
      },
    });
  }
}
