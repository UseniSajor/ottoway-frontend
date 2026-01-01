import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  priority?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type as any,
        title: params.title,
        message: params.message,
        read: false,
      },
    });

    logger.info('Notification created', { userId: params.userId, type: params.type });
    
    // TODO: Send email/push notification based on user preferences
  } catch (error) {
    logger.error('Error creating notification', { error, params });
  }
}

