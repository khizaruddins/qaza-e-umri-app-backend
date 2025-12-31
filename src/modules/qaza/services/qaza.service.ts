import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { CalculateQazaDto } from '../dtos/calculate-qaza.dto';
import { AdjustQazaDto } from '../dtos/adjust-qaza.dto';
import { ResetQazaDto } from '../dtos/reset-qaza.dto';
import { Operation } from '../enums/operation.enum';

@Injectable()
export class QazaService {
  constructor(private databaseService: DatabaseService) {}

  async getQaza(userId: string) {
    const qaza = await this.databaseService.prayerDebt.findUnique({
      where: { userId },
    });
    if (!qaza) {
      // Return default zeros if not found, or create one?
      // Let's return zeros structure
      return {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
        witr: 0,
      };
    }
    return qaza;
  }

  async calculateQaza(userId: string, calculateQazaDto: CalculateQazaDto) {
    const { years } = calculateQazaDto;
    const days = years * 365; // Simplified calculation

    const debt = {
      fajr: days,
      dhuhr: days,
      asr: days,
      maghrib: days,
      isha: days,
      witr: days,
    };

    return this.databaseService.prayerDebt.upsert({
      where: { userId },
      update: debt,
      create: {
        userId,
        ...debt,
      },
    });
  }

  async adjustQaza(userId: string, adjustQazaDto: AdjustQazaDto) {
    const { prayer, amount, operation } = adjustQazaDto;

    const currentDebt = await this.databaseService.prayerDebt.findUnique({
      where: { userId },
    });

    if (!currentDebt) {
      throw new NotFoundException(
        'Prayer debt record not found. Please calculate first.',
      );
    }

    let newAmount = currentDebt[prayer];
    if (operation === Operation.ADD) {
      newAmount += amount;
    } else {
      newAmount -= amount;
    }

    if (newAmount < 0) newAmount = 0;

    return this.databaseService.prayerDebt.update({
      where: { userId },
      data: {
        [prayer]: newAmount,
      },
    });
  }

  async resetQaza(userId: string, resetQazaDto: ResetQazaDto) {
    const defaultReset = {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      witr: 0,
    };

    const data = { ...defaultReset, ...resetQazaDto };

    // Remove undefined values from resetQazaDto if any (though class-validator handles types, optional fields might be undefined)
    // But here I spread defaultReset first, so undefineds in resetQazaDto would override defaults if I'm not careful?
    // No, spread copies properties. If resetQazaDto has undefined, it won't be in the object if I use `...resetQazaDto`?
    // Actually, if I do `{ ...default, ...dto }`, and dto has `fajr: undefined`, it might override `fajr: 0` with `undefined`?
    // Let's clean it up.

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );

    return this.databaseService.prayerDebt.upsert({
      where: { userId },
      update: cleanData,
      create: {
        userId,
        ...(cleanData as any), // Type assertion needed or proper typing
      },
    });
  }
}
