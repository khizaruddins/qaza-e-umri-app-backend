import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
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
import { UpdatePrayersDto } from '../dtos/update-prayers.dto';

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

  @Patch(':date/batch')
  @ApiOperation({ summary: 'Update multiple prayers in a single call' })
  @ApiResponse({
    status: 200,
    description: 'Prayers updated successfully',
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
  async updatePrayers(
    @Request() req,
    @Param('date') date: string,
    @Body() updatePrayersDto: UpdatePrayersDto,
  ) {
    return this.dailyLogService.updatePrayers(
      req.user.id,
      date,
      updatePrayersDto,
    );
  }

  @Get('unchecked/all')
  @ApiOperation({
    summary: 'Get all unchecked prayers from joining date till yesterday',
  })
  @ApiResponse({
    status: 200,
    description: 'Unchecked prayers retrieved',
    schema: {
      example: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalDays: 31,
        uncheckedCount: 186,
        uncheckedPrayers: [
          {
            date: '2024-01-01',
            type: 'ada',
            prayer: 'fajr',
            status: false,
          },
          {
            date: '2024-01-01',
            type: 'qaza',
            prayer: 'fajr',
            status: false,
          },
        ],
      },
    },
  })
  async getUncheckedPrayers(@Request() req) {
    return this.dailyLogService.getUncheckedPrayers(req.user.id);
  }

  @Get('date-wise/all')
  @ApiOperation({
    summary: 'Get all prayers date-wise with ada and qaza status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    example: '2024-01-01',
    description: 'Start date (defaults to joining date)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    example: '2024-01-31',
    description: 'End date (defaults to yesterday)',
  })
  @ApiResponse({
    status: 200,
    description: 'Date-wise prayers retrieved',
    schema: {
      example: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalDays: 31,
        data: [
          {
            date: '2024-01-01',
            prayers: [
              { prayer: 'fajr', ada: true, qaza: false },
              { prayer: 'dhuhr', ada: false, qaza: true },
              { prayer: 'asr', ada: true, qaza: false },
              { prayer: 'maghrib', ada: true, qaza: false },
              { prayer: 'isha', ada: false, qaza: false },
              { prayer: 'witr', ada: true, qaza: false },
            ],
          },
        ],
      },
    },
  })
  async getPrayersDateWise(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dailyLogService.getPrayersDateWise(
      req.user.id,
      startDate,
      endDate,
    );
  }
}
