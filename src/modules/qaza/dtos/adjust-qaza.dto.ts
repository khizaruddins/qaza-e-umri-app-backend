import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Prayer } from '../enums/prayer.enum';
import { Operation } from '../enums/operation.enum';

export class AdjustQazaDto {
  @ApiProperty({ enum: Prayer, example: Prayer.FAJR })
  @IsEnum(Prayer)
  @IsNotEmpty()
  prayer: Prayer;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: Operation, example: Operation.SUBTRACT })
  @IsEnum(Operation)
  @IsNotEmpty()
  operation: Operation;
}
