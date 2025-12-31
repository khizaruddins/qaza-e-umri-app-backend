import { Module } from '@nestjs/common';
import { DailyLogController } from './controllers/daily-log.controller';
import { DailyLogService } from './services/daily-log.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DailyLogController],
  providers: [DailyLogService],
  exports: [DailyLogService],
})
export class DailyLogModule {}
