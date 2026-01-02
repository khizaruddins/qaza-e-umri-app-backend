import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import { ApprovePaymentDto } from '../dtos/approve-payment.dto';
import { SubmitProofDto } from '../dtos/submit-proof.dto';
import { PaymentStatus, NotificationType } from '@prisma/client';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const subscription =
      await this.paymentRepository.findLatestSubscriptionByUserIdPending(
        userId,
      );

    if (subscription) {
      return subscription;
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days subscription

    return this.paymentRepository.createSubscription({
      user: { connect: { id: userId } },
      amount: dto.amount,
      currency: dto.currency || 'INR',
      startDate,
      endDate,
      status: PaymentStatus.PENDING,
    });
  }

  async submitProof(userId: string, dto: SubmitProofDto) {
    const subscription =
      await this.paymentRepository.findLatestSubscriptionByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    if (subscription.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Latest subscription is not pending');
    }

    return this.paymentRepository.updateSubscriptionStatus(
      subscription.id,
      PaymentStatus.PENDING,
      dto.transactionId,
    );
  }

  async approvePayment(dto: ApprovePaymentDto) {
    const subscription = await this.paymentRepository.findSubscriptionById(
      dto.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Subscription already active');
    }

    if (subscription.transactionId !== dto.transactionId) {
      throw new BadRequestException('Transaction ID mismatched');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription from approval

    // Update subscription
    const updatedSubscription =
      await this.paymentRepository.updateSubscriptionStatus(
        dto.subscriptionId,
        PaymentStatus.COMPLETED,
        dto.transactionId,
        startDate,
        endDate,
      );

    // Update user premium status
    await this.paymentRepository.updateUserPremiumStatus(
      subscription.userId,
      true,
      startDate, // paymentDate
      endDate, // nextPaymentDate
    );

    // Send success notification
    await this.notificationService.createNotification(
      subscription.userId,
      'Subscription Activated',
      'Your payment has been approved. You are now a Premium user!',
      NotificationType.SUCCESS,
    );

    return updatedSubscription;
  }
}
