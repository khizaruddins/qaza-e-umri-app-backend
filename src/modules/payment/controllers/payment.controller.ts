import { Controller, Post, Body, Req } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import { ApprovePaymentDto } from '../dtos/approve-payment.dto';
import { SubmitProofDto } from '../dtos/submit-proof.dto';
import { CreatePlanSubscriptionDto } from '../dtos/create-plan-subscription.dto';
import { VerifySubscriptionDto } from '../dtos/verify-subscription.dto';
import { CreateTipDto } from '../dtos/create-tip.dto';
import { VerifyTipDto } from '../dtos/verify-tip.dto';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('subscription')
  @ApiOperation({ summary: 'Create a new subscription (Legacy/Manual)' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        userId: '60d5ecb8b5c9c62b3c7c1b5f',
        amount: 100,
        currency: 'INR',
        status: 'PENDING',
        gateway: 'QR_CODE',
        startDate: '2025-12-31T10:00:00.000Z',
        endDate: '2026-01-30T10:00:00.000Z',
        createdAt: '2025-12-31T10:00:00.000Z',
        updatedAt: '2025-12-31T10:00:00.000Z',
      },
    },
  })
  async createSubscription(@Req() req, @Body() dto: CreateSubscriptionDto) {
    return this.paymentService.createSubscription(req.user.id, dto);
  }

  @Post('submit-proof')
  @ApiOperation({ summary: 'Submit payment proof (transaction ID)' })
  @ApiResponse({
    status: 200,
    description: 'Proof submitted successfully',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        userId: '60d5ecb8b5c9c62b3c7c1b5f',
        amount: 100,
        currency: 'INR',
        status: 'PENDING',
        transactionId: 'txn_1234567890',
        gateway: 'QR_CODE',
        startDate: '2025-12-31T10:00:00.000Z',
        endDate: '2026-01-30T10:00:00.000Z',
        createdAt: '2025-12-31T10:00:00.000Z',
        updatedAt: '2025-12-31T10:00:00.000Z',
      },
    },
  })
  async submitProof(@Req() req, @Body() dto: SubmitProofDto) {
    return this.paymentService.submitProof(req.user.id, dto);
  }

  @Post('approve')
  @ApiOperation({ summary: 'Approve a payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment approved and subscription activated',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        userId: '60d5ecb8b5c9c62b3c7c1b5f',
        amount: 100,
        currency: 'INR',
        status: 'COMPLETED',
        transactionId: 'txn_1234567890',
        gateway: 'QR_CODE',
        startDate: '2025-12-31T10:00:00.000Z',
        endDate: '2026-12-31T10:00:00.000Z',
        createdAt: '2025-12-31T09:00:00.000Z',
        updatedAt: '2025-12-31T10:00:00.000Z',
      },
    },
  })
  async approvePayment(@Body() dto: ApprovePaymentDto) {
    return this.paymentService.approvePayment(dto);
  }

  // --- Razorpay Endpoints ---

  @Post('razorpay/subscription')
  @ApiOperation({ summary: 'Create a Razorpay Plan Subscription' })
  async createPlanSubscription(
    @Req() req,
    @Body() dto: CreatePlanSubscriptionDto,
  ) {
    return this.paymentService.createPlanSubscription(req.user.id, dto);
  }

  @Post('razorpay/subscription/verify')
  @ApiOperation({ summary: 'Verify Razorpay Subscription Signature' })
  async verifySubscription(@Req() req, @Body() dto: VerifySubscriptionDto) {
    return this.paymentService.verifySubscription(req.user.id, dto);
  }

  @Post('razorpay/tip')
  @ApiOperation({ summary: 'Create a Tip Order' })
  async createTip(@Req() req, @Body() dto: CreateTipDto) {
    // If auth is optional, req.user might be undefined.
    // However, @ApiBearerAuth() suggests it's protected globally or here.
    return this.paymentService.createTip(req.user?.id, dto);
  }

  @Post('razorpay/tip/verify')
  @ApiOperation({ summary: 'Verify Tip Payment' })
  async verifyTip(@Body() dto: VerifyTipDto) {
    // Verification doesn't strictly need user context if signature matches
    return this.paymentService.verifyTip(dto);
  }
}
