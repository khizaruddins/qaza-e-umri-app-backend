import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { Prisma, Notification } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async createNotification(
    data: Prisma.NotificationCreateInput,
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data,
    });
  }

  async findNotificationsByUserId(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
