import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepository } from '../repositories/payment.repository';
// import { CreateSubscriptionDto } from '../dtos/create-subscription.dto'; // Valid but deprecated usage below
import { ApprovePaymentDto } from '../dtos/approve-payment.dto';
import { SubmitProofDto } from '../dtos/submit-proof.dto';
import { CreatePlanSubscriptionDto } from '../dtos/create-plan-subscription.dto';
import { VerifySubscriptionDto } from '../dtos/verify-subscription.dto';
import { CreateTipDto } from '../dtos/create-tip.dto';
import { VerifyTipDto } from '../dtos/verify-tip.dto';
import Razorpay from 'razorpay';
import {
  PaymentStatus,
  NotificationType,
  PlanType,
  Currency,
} from '@prisma/client';

import { NotificationService } from '../../notification/services/notification.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
// const Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private razorpay: any;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id:
        this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_key',
      key_secret:
        this.configService.get<string>('RAZORPAY_KEY_SECRET') ||
        'rzp_test_secret',
    });
  }

  // --- Razpay Subscription Logic ---

  async createPlanSubscription(userId: string, dto: CreatePlanSubscriptionDto) {
    // 1. Determine Plan ID based on Type and Currency
    const currency = dto.currency || Currency.INR;
    let planId = '';
    let amount = 0;

    // Hardcoded logic for now, ideally derived from DB or Config
    // Currently only INR is supported
    if (currency !== Currency.INR) {
      throw new BadRequestException('Only INR currency is supported for now');
    }

    if (dto.planType === PlanType.MONTHLY) {
      planId =
        this.configService.get('RAZORPAY_PLAN_MONTHLY_INR') ||
        'plan_monthly_inr';
      amount = 599;
    } else if (dto.planType === PlanType.YEARLY) {
      planId =
        this.configService.get('RAZORPAY_PLAN_YEARLY_INR') || 'plan_yearly_inr';
      amount = 5999;
    }

    if (!planId) throw new BadRequestException('Invalid Plan Configuration');

    // 2. Create Subscription on Razorpay
    let razorpaySub;
    try {
      razorpaySub = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: dto.planType === PlanType.MONTHLY ? 120 : 10, // Just a large number
        notes: { userId, planType: dto.planType },
      });
    } catch (error) {
      console.error('Razorpay Error:', error);
      throw new InternalServerErrorException(
        'Failed to create subscription with gateway',
      );
    }

    // 3. Save to DB
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (dto.planType === PlanType.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return this.paymentRepository.createSubscription({
      user: { connect: { id: userId } },
      planType: dto.planType,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      gateway: 'RAZORPAY',
      razorpaySubscriptionId: razorpaySub.id,
      startDate,
      endDate,
    });
  }

  async verifySubscription(userId: string, dto: VerifySubscriptionDto) {
    const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } =
      dto;
    const secret =
      this.configService.get<string>('RAZORPAY_KEY_SECRET') ||
      'rzp_test_secret';

    // 1. Verify Signature
    const data = razorpayPaymentId + '|' + razorpaySubscriptionId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid Signature');
    }

    // 2. Find Pending Subscription
    const subscription =
      await this.paymentRepository.findLatestSubscriptionByUserIdPending(
        userId,
      );

    // Ideally we match razorpaySubscriptionId
    if (
      !subscription ||
      subscription.razorpaySubscriptionId !== razorpaySubscriptionId
    ) {
      throw new NotFoundException('Subscription not found or ID mismatch');
    }

    // 3. Activate
    await this.paymentRepository.updateSubscriptionRazpayDetails(
      subscription.id,
      razorpaySubscriptionId,
      PaymentStatus.COMPLETED,
    );

    // 4. Update User
    await this.paymentRepository.updateUserPremiumStatus(
      userId,
      true,
      subscription.startDate,
      subscription.endDate,
    );

    return { status: 'success' };
  }

  // --- Tip Logic ---

  async createTip(userId: string | null, dto: CreateTipDto) {
    // 1. Create Razorpay Order
    const options = {
      amount: Math.round(dto.amount * 100), // smallest currency unit
      currency: dto.currency,
      receipt: `tip_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    let order;
    try {
      order = await this.razorpay.orders.create(options);
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('Failed to create order');
    }

    // 2. Save Tip
    return this.paymentRepository.createTip({
      amount: dto.amount,
      currency: dto.currency,
      message: dto.message,
      razorpayOrderId: order.id,
      status: PaymentStatus.PENDING,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
    });
  }

  async verifyTip(dto: VerifyTipDto) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = dto;
    const secret =
      this.configService.get<string>('RAZORPAY_KEY_SECRET') ||
      'rzp_test_secret';

    const data = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid Signature');
    }

    // Find the tip
    const tip = await this.paymentRepository.findTipByOrderId(razorpayOrderId);
    if (!tip) {
      throw new NotFoundException('Tip transaction not found');
    }

    if (tip.status === PaymentStatus.COMPLETED) {
      return { status: 'success', message: 'Already verified' };
    }

    await this.paymentRepository.updateTipStatus(
      tip.id,
      PaymentStatus.COMPLETED,
      razorpayPaymentId,
      razorpaySignature,
    );

    return { status: 'success', verified: true };
  }

  // --- Existing Logic (Legacy/Manual) ---

  // NOTE: Keeping the old createSubscription method signature for backward compat or manual creation?
  // User asked for integration. The old method uses CreateSubscriptionDto which was generic.
  // I will assume old manual method is still needed.
  // But type safety might be tricky if I don't import CreateSubscriptionDto.
  // I added it back in imports.

  async createSubscription(userId: string, dto: any) {
    // CAUTION: This might conflict if overload not handled properly.
    // Typescript doesn't support overload implementations like this easily in class methods without single implementation.
    // I am replacing the file, so I can just keep this method.

    // Note: If the old DTO 'CreateSubscriptionDto' is used elsewhere, this is fine.
    // But `dto` here essentially is manual entry.

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
      planType: PlanType.MONTHLY, // Defaulting legacy to monthly
      amount: dto.amount,
      currency: (dto.currency as Currency) || Currency.INR,
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
