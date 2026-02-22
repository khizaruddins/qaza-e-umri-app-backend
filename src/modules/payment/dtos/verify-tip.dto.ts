import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTipDto {
  @ApiProperty({
    description: 'Razorpay Order ID',
    example: 'order_234...',
  })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({
    description: 'Razorpay Payment ID',
    example: 'pay_293839282',
  })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({
    description: 'Razorpay Signature',
    example: 'e234324...',
  })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
