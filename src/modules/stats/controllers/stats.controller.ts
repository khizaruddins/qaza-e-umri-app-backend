import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatsService } from '../services/stats.service';

@ApiTags('Stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get aggregated data for the dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved',
    schema: {
      example: {
        totalPrayersOfferedThisMonth: 50,
        totalDebt: 1000,
        estimatedCompletionDate: '2026-01-01',
      },
    },
  })
  async getSummary(@Request() req) {
    return this.statsService.getSummary(req.user.id);
  }
}
