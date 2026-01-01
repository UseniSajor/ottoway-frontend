import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

export async function logAuditEvent(params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: {
          previousData: params.previousData,
          newData: params.newData,
          metadata: params.metadata,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    logger.error('Audit logging error', { error, params });
    // Don't throw - audit failures shouldn't break operations
  }
}

// Express middleware
export function auditMiddleware(action: string, resource: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (data: any) {
      logAuditEvent({
        userId: req.user?.id,
        action,
        resource,
        resourceId: req.params?.id,
        newData: data,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
        },
      });

      return originalJson.call(this, data);
    };

    next();
  };
}

