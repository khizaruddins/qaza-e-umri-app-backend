import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateQazaDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  years: number;

  @ApiProperty({ example: 'standard' })
  @IsString()
  @IsNotEmpty()
  calculationMethod: string;
}
