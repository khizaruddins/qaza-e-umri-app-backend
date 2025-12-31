import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';

@Injectable()
export class StatsService {
  constructor(private databaseService: DatabaseService) {}

  async getSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // 1. Total prayers offered this month
    const logs = await this.databaseService.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    let totalPrayersOffered = 0;
    logs.forEach((log) => {
      if (log.adaFajr) totalPrayersOffered++;
      if (log.adaDhuhr) totalPrayersOffered++;
      if (log.adaAsr) totalPrayersOffered++;
      if (log.adaMaghrib) totalPrayersOffered++;
      if (log.adaIsha) totalPrayersOffered++;
      if (log.adaWitr) totalPrayersOffered++;

      if (log.qazaFajr) totalPrayersOffered++;
      if (log.qazaDhuhr) totalPrayersOffered++;
      if (log.qazaAsr) totalPrayersOffered++;
      if (log.qazaMaghrib) totalPrayersOffered++;
      if (log.qazaIsha) totalPrayersOffered++;
      if (log.qazaWitr) totalPrayersOffered++;
    });

    // 2. Current Debt
    const debt = await this.databaseService.prayerDebt.findUnique({
      where: { userId },
    });

    let totalDebt = 0;
    if (debt) {
      totalDebt =
        debt.fajr +
        debt.dhuhr +
        debt.asr +
        debt.maghrib +
        debt.isha +
        debt.witr;
    }

    // 3. Estimated Completion Date (CHECKLIST: assume 1 year goal or based on recent activity)
    // For now, let's return null or a placeholder.
    // Or if user has qazaGoalYears, use that?
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { qazaGoalYears: true },
    });

    let estimatedCompletionDate: string | null = null;
    if (user && user.qazaGoalYears > 0) {
      const completionDate = new Date();
      completionDate.setFullYear(
        completionDate.getFullYear() + user.qazaGoalYears,
      );
      estimatedCompletionDate = completionDate.toISOString().split('T')[0];
    }

    return {
      totalPrayersOfferedThisMonth: totalPrayersOffered,
      totalDebt,
      estimatedCompletionDate,
    };
  }
}
