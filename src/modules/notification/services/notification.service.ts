import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
  ) {
    return this.notificationRepository.createNotification({
      user: { connect: { id: userId } },
      title,
      message,
      type,
    });
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.findNotificationsByUserId(userId);
  }

  async markAsRead(id: string) {
    return this.notificationRepository.markAsRead(id);
  }
}
