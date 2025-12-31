import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitProofDto {
  @ApiProperty({
    description: 'Transaction ID of the payment proof',
    example: 'txn_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}
