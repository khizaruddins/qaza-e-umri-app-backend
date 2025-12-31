import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Prayer } from '../../qaza/enums/prayer.enum';
import { LogType } from '../enums/log-type.enum';

export class TogglePrayerDto {
  @ApiProperty({ enum: LogType, example: LogType.ADA })
  @IsEnum(LogType)
  @IsNotEmpty()
  type: LogType;

  @ApiProperty({ enum: Prayer, example: Prayer.FAJR })
  @IsEnum(Prayer)
  @IsNotEmpty()
  prayer: Prayer;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}
