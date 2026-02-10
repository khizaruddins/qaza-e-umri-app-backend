import { IsNumber, IsEnum, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class CreateTipDto {
  @ApiProperty({
    description: 'Amount to tip',
    example: 100,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    enum: Currency,
    description: 'Currency: Only INR supported',
    default: Currency.INR,
    example: Currency.INR,
  })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({
    description: 'Optional message for the developer',
    required: false,
    example: 'Great work!',
  })
  @IsString()
  @IsOptional()
  message?: string;
}
