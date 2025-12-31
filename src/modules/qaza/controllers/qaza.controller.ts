import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QazaService } from '../services/qaza.service';
import { CalculateQazaDto } from '../dtos/calculate-qaza.dto';
import { AdjustQazaDto } from '../dtos/adjust-qaza.dto';
import { ResetQazaDto } from '../dtos/reset-qaza.dto';

@ApiTags('Qaza')
@ApiBearerAuth()
@Controller('qaza')
export class QazaController {
  constructor(private qazaService: QazaService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current PrayerDebt counts' })
  @ApiResponse({
    status: 200,
    description: 'Prayer debt retrieved',
    schema: {
      example: {
        fajr: 100,
        dhuhr: 100,
        asr: 100,
        maghrib: 100,
        isha: 100,
        witr: 100,
      },
    },
  })
  async getQaza(@Request() req) {
    return this.qazaService.getQaza(req.user.id);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate and set initial debt' })
  @ApiResponse({
    status: 200,
    description: 'Debt calculated and set',
    schema: {
      example: {
        fajr: 3650,
        dhuhr: 3650,
        asr: 3650,
        maghrib: 3650,
        isha: 3650,
        witr: 3650,
      },
    },
  })
  async calculateQaza(
    @Request() req,
    @Body() calculateQazaDto: CalculateQazaDto,
  ) {
    return this.qazaService.calculateQaza(req.user.id, calculateQazaDto);
  }

  @Patch('adjust')
  @ApiOperation({ summary: 'Manually add or subtract from the debt' })
  @ApiResponse({
    status: 200,
    description: 'Debt adjusted',
    schema: {
      example: {
        fajr: 99,
        dhuhr: 100,
        asr: 100,
        maghrib: 100,
        isha: 100,
        witr: 100,
      },
    },
  })
  async adjustQaza(@Request() req, @Body() adjustQazaDto: AdjustQazaDto) {
    return this.qazaService.adjustQaza(req.user.id, adjustQazaDto);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all counts to zero or a specific value' })
  @ApiResponse({
    status: 200,
    description: 'Debt reset',
    schema: {
      example: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
        witr: 0,
      },
    },
  })
  async resetQaza(@Request() req, @Body() resetQazaDto: ResetQazaDto) {
    return this.qazaService.resetQaza(req.user.id, resetQazaDto);
  }
}
