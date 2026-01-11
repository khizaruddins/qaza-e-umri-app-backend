import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { TogglePrayerDto } from '../dtos/toggle-prayer.dto';
import { UpdatePrayersDto } from '../dtos/update-prayers.dto';
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

  async updatePrayers(
    userId: string,
    date: string,
    updatePrayersDto: UpdatePrayersDto,
  ) {
    return this.databaseService.$transaction(async (prisma) => {
      // 1. Get existing log to check current statuses
      const existingLog = await prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
      });

      // 2. Prepare update data and track qaza changes for debt updates
      const updateData: any = {};
      const debtChanges: { [key in Prayer]?: number } = {};

      for (const prayerUpdate of updatePrayersDto.prayers) {
        const { type, prayer, status } = prayerUpdate;
        const fieldName = `${type}${prayer.charAt(0).toUpperCase() + prayer.slice(1)}`;

        const currentStatus = existingLog ? existingLog[fieldName] : false;

        // Add to update data
        updateData[fieldName] = status;

        // Track qaza changes for debt update
        if (type === LogType.QAZA && currentStatus !== status) {
          if (!debtChanges[prayer]) {
            debtChanges[prayer] = 0;
          }

          if (status) {
            // Decrement debt (qaza became true/completed)
            debtChanges[prayer] -= 1;
          } else {
            // Increment debt (qaza became false/uncompleted)
            debtChanges[prayer] += 1;
          }
        }
      }

      // 3. Update or Create DailyLog
      const log = await prisma.dailyLog.upsert({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
        update: updateData,
        create: {
          userId,
          date,
          ...updateData,
        },
      });

      // 4. Update PrayerDebt if there are qaza changes
      if (Object.keys(debtChanges).length > 0) {
        const debt = await prisma.prayerDebt.findUnique({
          where: { userId },
        });

        if (debt) {
          const debtUpdateData: any = {};

          for (const [prayer, change] of Object.entries(debtChanges)) {
            const currentDebt = debt[prayer as Prayer];
            debtUpdateData[prayer] = Math.max(0, currentDebt + change);
          }

          await prisma.prayerDebt.update({
            where: { userId },
            data: debtUpdateData,
          });
        }
      }

      return log;
    });
  }

  async getUncheckedPrayers(userId: string) {
    // 1. Get user to find joining date (createdAt)
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 2. Calculate date range: from joining date to yesterday
    const joiningDate = new Date(user.createdAt);
    joiningDate.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const startDate = joiningDate.toISOString().split('T')[0];
    const endDate = yesterday.toISOString().split('T')[0];

    // 3. Get all logs in this range
    const logs = await this.databaseService.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 4. Create a map of existing logs
    const logMap = new Map(logs.map((log) => [log.date, log]));

    // 5. Generate all dates in range and identify unchecked prayers
    const uncheckedPrayers: {
      date: string;
      type: LogType;
      prayer: Prayer;
      status: boolean;
    }[] = [];
    const prayers: Prayer[] = [
      Prayer.FAJR,
      Prayer.DHUHR,
      Prayer.ASR,
      Prayer.MAGHRIB,
      Prayer.ISHA,
      Prayer.WITR,
    ];
    const types: LogType[] = [LogType.ADA, LogType.QAZA];

    let currentDate = new Date(joiningDate);
    while (currentDate <= yesterday) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const log = logMap.get(dateStr);

      for (const prayer of prayers) {
        for (const type of types) {
          const fieldName = `${type}${prayer.charAt(0).toUpperCase() + prayer.slice(1)}`;
          const isChecked = log ? log[fieldName] : false;

          if (!isChecked) {
            uncheckedPrayers.push({
              date: dateStr,
              type,
              prayer,
              status: false,
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      startDate,
      endDate,
      totalDays:
        Math.ceil(
          (yesterday.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1,
      uncheckedCount: uncheckedPrayers.length,
      uncheckedPrayers,
    };
  }

  async getPrayersDateWise(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. If dates not provided, get from joining date to yesterday
    if (!startDate || !endDate) {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const joiningDate = new Date(user.createdAt);
      joiningDate.setHours(0, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      startDate = joiningDate.toISOString().split('T')[0];
      endDate = yesterday.toISOString().split('T')[0];
    }

    // 2. Get all logs in range
    const logs = await this.databaseService.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 3. Create detailed date-wise prayer breakdown
    const logMap = new Map(logs.map((log) => [log.date, log]));
    const prayers: Prayer[] = [
      Prayer.FAJR,
      Prayer.DHUHR,
      Prayer.ASR,
      Prayer.MAGHRIB,
      Prayer.ISHA,
      Prayer.WITR,
    ];

    const dateWisePrayers: {
      date: string;
      prayers: { prayer: Prayer; ada: any; qaza: any }[];
    }[] = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const log = logMap.get(dateStr);

      const dayPrayers = prayers.map((prayer) => {
        const adaField = `ada${prayer.charAt(0).toUpperCase() + prayer.slice(1)}`;
        const qazaField = `qaza${prayer.charAt(0).toUpperCase() + prayer.slice(1)}`;

        return {
          prayer,
          ada: log ? log[adaField] : false,
          qaza: log ? log[qazaField] : false,
        };
      });

      dateWisePrayers.push({
        date: dateStr,
        prayers: dayPrayers,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      startDate,
      endDate,
      totalDays: dateWisePrayers.length,
      data: dateWisePrayers,
    };
  }
}
