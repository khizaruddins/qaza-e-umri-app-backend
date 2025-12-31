import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaymentRepository } from './repositories/payment.repository';
import { DatabaseModule } from '../database/database.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentSchedulerService } from './services/payment-scheduler.service';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PaymentSchedulerService],
  exports: [PaymentService],
})
export class PaymentModule {}
