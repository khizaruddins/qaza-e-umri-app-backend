import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Prayer } from '../../qaza/enums/prayer.enum';
import { LogType } from '../enums/log-type.enum';

export class PrayerUpdateItem {
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

export class UpdatePrayersDto {
  @ApiProperty({
    type: [PrayerUpdateItem],
    example: [
      { type: 'ada', prayer: 'fajr', status: true },
      { type: 'qaza', prayer: 'fajr', status: false },
      { type: 'ada', prayer: 'dhuhr', status: true },
      { type: 'ada', prayer: 'asr', status: false },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrayerUpdateItem)
  prayers: PrayerUpdateItem[];
}
