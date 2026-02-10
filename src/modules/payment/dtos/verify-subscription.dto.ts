import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifySubscriptionDto {
  @ApiProperty({
    description: 'Razorpay Payment ID',
    example: 'pay_293839282',
  })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({
    description: 'Razorpay Subscription ID',
    example: 'sub_23782378',
  })
  @IsString()
  @IsNotEmpty()
  razorpaySubscriptionId: string;

  @ApiProperty({
    description: 'Razorpay Signature',
    example: 'e234324...',
  })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
