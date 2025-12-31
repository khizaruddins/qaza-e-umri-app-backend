import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrackingMode } from '@prisma/client';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: TrackingMode, example: TrackingMode.CHECKLIST })
  @IsOptional()
  @IsEnum(TrackingMode)
  trackingMode?: TrackingMode;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  qazaGoalYears?: number;
}
