import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentRepository } from '../repositories/payment.repository';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class PaymentSchedulerService {
  private readonly logger = new Logger(PaymentSchedulerService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePaymentReminders() {
    this.logger.log('Running payment reminder job...');

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const users =
      await this.paymentRepository.findUsersDueForPayment(threeDaysFromNow);

    this.logger.log(`Found ${users.length} users due for payment in 3 days.`);

    for (const user of users) {
      await this.notificationService.createNotification(
        user.id,
        'Payment Reminder',
        'Your subscription will renew in 3 days. Please ensure your payment method is up to date.',
        NotificationType.WARNING,
      );
      this.logger.log(`Sent reminder to user ${user.id}`);
    }

    // Trial Expiry Reminder
    const twentySevenDaysAgo = new Date();
    twentySevenDaysAgo.setDate(twentySevenDaysAgo.getDate() - 27);

    const trialUsers =
      await this.paymentRepository.findUsersDueForTrialExpiry(
        twentySevenDaysAgo,
      );

    this.logger.log(
      `Found ${trialUsers.length} users due for trial expiry in 3 days.`,
    );

    for (const user of trialUsers) {
      await this.notificationService.createNotification(
        user.id,
        'Trial Ending Soon',
        'Your free trial will end in 3 days. Please subscribe to continue using premium features.',
        NotificationType.WARNING,
      );
      this.logger.log(`Sent trial reminder to user ${user.id}`);
    }
  }
}
