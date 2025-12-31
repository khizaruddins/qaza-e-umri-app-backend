import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DailyLogService } from '../services/daily-log.service';
import { TogglePrayerDto } from '../dtos/toggle-prayer.dto';

@ApiTags('Daily Logs')
@ApiBearerAuth()
@Controller('daily-logs')
export class DailyLogController {
  constructor(private dailyLogService: DailyLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get logs for a specific range' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved',
    schema: {
      example: [
        {
          date: '2024-01-01',
          adaFajr: true,
          adaDhuhr: true,
          adaAsr: true,
          adaMaghrib: true,
          adaIsha: true,
          adaWitr: true,
          qazaFajr: false,
          qazaDhuhr: false,
          qazaAsr: false,
          qazaMaghrib: false,
          qazaIsha: false,
          qazaWitr: false,
        },
      ],
    },
  })
  async getLogs(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dailyLogService.getLogs(req.user.id, startDate, endDate);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get the log for a specific single date' })
  @ApiResponse({
    status: 200,
    description: 'Log retrieved',
    schema: {
      example: {
        date: '2024-01-01',
        adaFajr: true,
        adaDhuhr: true,
        adaAsr: true,
        adaMaghrib: true,
        adaIsha: true,
        adaWitr: true,
        qazaFajr: false,
        qazaDhuhr: false,
        qazaAsr: false,
        qazaMaghrib: false,
        qazaIsha: false,
        qazaWitr: false,
      },
    },
  })
  async getLogByDate(@Request() req, @Param('date') date: string) {
    return this.dailyLogService.getLogByDate(req.user.id, date);
  }

  @Patch(':date')
  @ApiOperation({ summary: 'Toggle a prayer status' })
  @ApiResponse({
    status: 200,
    description: 'Log updated',
    schema: {
      example: {
        date: '2024-01-01',
        adaFajr: true,
        adaDhuhr: true,
        adaAsr: true,
        adaMaghrib: true,
        adaIsha: true,
        adaWitr: true,
        qazaFajr: false,
        qazaDhuhr: false,
        qazaAsr: false,
        qazaMaghrib: false,
        qazaIsha: false,
        qazaWitr: false,
      },
    },
  })
  async togglePrayer(
    @Request() req,
    @Param('date') date: string,
    @Body() togglePrayerDto: TogglePrayerDto,
  ) {
    return this.dailyLogService.togglePrayer(
      req.user.id,
      date,
      togglePrayerDto,
    );
  }
}
