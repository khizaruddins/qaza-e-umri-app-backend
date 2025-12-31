import { Controller, Post, Body, Req } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import { ApprovePaymentDto } from '../dtos/approve-payment.dto';
import { SubmitProofDto } from '../dtos/submit-proof.dto';
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
  @ApiOperation({ summary: 'Create a new subscription' })
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
  async approvePayment(@Req() req, @Body() dto: ApprovePaymentDto) {
    return this.paymentService.approvePayment(req.user.id, dto);
  }
}
