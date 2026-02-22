import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanType, Currency } from '@prisma/client';

export class CreatePlanSubscriptionDto {
  @ApiProperty({
    enum: PlanType,
    description: 'Plan Type: MONTHLY or YEARLY',
    example: PlanType.MONTHLY,
  })
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiProperty({
    enum: Currency,
    description: 'Currency: Only INR supported',
    default: Currency.INR,
    required: false,
    example: Currency.INR,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;
}
