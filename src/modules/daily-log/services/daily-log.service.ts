import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { TogglePrayerDto } from '../dtos/toggle-prayer.dto';
import { LogType } from '../enums/log-type.enum';
import { Prayer } from '../../qaza/enums/prayer.enum';

@Injectable()
export class DailyLogService {
  constructor(private databaseService: DatabaseService) {}

  async getLogs(userId: string, startDate: string, endDate: string) {
    return this.databaseService.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async getLogByDate(userId: string, date: string) {
    const log = await this.databaseService.dailyLog.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (!log) {
      // Return empty log structure if not found? Or create one?
      // Usually frontend expects something. Let's return a default structure or null.
      // If I return null, frontend might break.
      // Let's create it if it doesn't exist? No, GET shouldn't create.
      // But for daily log, it's often useful to have a default.
      // Let's return null and let controller handle or frontend handle.
      return null;
    }
    return log;
  }

  async togglePrayer(
    userId: string,
    date: string,
    togglePrayerDto: TogglePrayerDto,
  ) {
    const { type, prayer, status } = togglePrayerDto;

    // Construct field name, e.g., adaFajr, qazaFajr
    const fieldName = `${type}${prayer.charAt(0).toUpperCase() + prayer.slice(1)}`;

    return this.databaseService.$transaction(async (prisma) => {
      // 1. Check existing log to verify if status actually changed
      const existingLog = await prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
      });

      const currentStatus = existingLog ? existingLog[fieldName] : false;

      if (currentStatus === status) {
        // No change in status, return existing log or create if not exists (idempotent)
        if (existingLog) return existingLog;
        // If it didn't exist but status is false (default), we might still want to create it?
        // If status is false and we are setting to false, and it doesn't exist, creating it with false is fine.
      }

      // 2. Update or Create DailyLog
      const log = await prisma.dailyLog.upsert({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
        update: {
          [fieldName]: status,
        },
        create: {
          userId,
          date,
          [fieldName]: status,
        },
      });

      // 3. Update PrayerDebt if type is Qaza AND status changed
      if (type === LogType.QAZA && currentStatus !== status) {
        const debt = await prisma.prayerDebt.findUnique({
          where: { userId },
        });

        if (debt) {
          let newAmount = debt[prayer];
          if (status) {
            // Decrement debt (became true)
            newAmount = Math.max(0, newAmount - 1);
          } else {
            // Increment debt (became false)
            newAmount += 1;
          }

          await prisma.prayerDebt.update({
            where: { userId },
            data: {
              [prayer]: newAmount,
            },
          });
        }
      }

      return log;
    });
  }
}
