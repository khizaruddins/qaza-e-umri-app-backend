import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApprovePaymentDto {
  @ApiProperty({
    description: 'The ID of the subscription to approve',
    example: '60d5ecb8b5c9c62b3c7c1b5e',
  })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({
    description: 'The transaction ID from the payment gateway',
    example: 'txn_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}
