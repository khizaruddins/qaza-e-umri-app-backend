import { Controller, Get, Patch, Param, Req } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'List of user notifications',
    schema: {
      example: [
        {
          id: '60d5ecb8b5c9c62b3c7c1b5e',
          userId: '60d5ecb8b5c9c62b3c7c1b5f',
          title: 'Payment Reminder',
          message: 'Your subscription will renew in 3 days.',
          isRead: false,
          type: 'WARNING',
          createdAt: '2025-12-31T10:00:00.000Z',
        },
      ],
    },
  })
  async getUserNotifications(@Req() req) {
    return this.notificationService.getUserNotifications(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '60d5ecb8b5c9c62b3c7c1b5e',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    schema: {
      example: {
        id: '60d5ecb8b5c9c62b3c7c1b5e',
        userId: '60d5ecb8b5c9c62b3c7c1b5f',
        title: 'Payment Reminder',
        message: 'Your subscription will renew in 3 days.',
        isRead: true,
        type: 'WARNING',
        createdAt: '2025-12-31T10:00:00.000Z',
      },
    },
  })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
