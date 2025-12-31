import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Amount for the subscription',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Currency code (e.g., INR, USD)',
    example: 'INR',
    default: 'INR',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;
}
