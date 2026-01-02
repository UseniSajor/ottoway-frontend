import { PrismaClient } from '@prisma/client';
import { mlEngine } from './mlEngine.js';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function processProjectEvent(eventId: string) {
  try {
    const event = await prisma.projectEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.featuresExtracted) {
      return;
    }

    // Extract features
    await mlEngine.extractProjectFeatures(event.projectId);

    // Run relevant models based on event type
    if (shouldRunPermitRisk(event.eventType)) {
      await mlEngine.assessPermitRisk(event.projectId);
    }

    // Generate recommendations for significant events
    if (shouldGenerateRecommendation(event.eventType)) {
      await mlEngine.generateNextBestAction(event.projectId);
    }

    // Mark as processed
    await prisma.projectEvent.update({
      where: { id: eventId },
      data: { featuresExtracted: true },
    });

    logger.info('Event processed', { eventId, eventType: event.eventType });
  } catch (error) {
    logger.error('Error processing event', { error, eventId });
  }
}

function shouldRunPermitRisk(eventType: string): boolean {
  return [
    'CONTRACT_SIGNED',
    'DESIGN_APPROVED',
    'READINESS_ITEM_COMPLETED',
    'STATUS_CHANGE',
  ].includes(eventType);
}

function shouldGenerateRecommendation(eventType: string): boolean {
  return [
    'PROJECT_CREATED',
    'STATUS_CHANGE',
    'MILESTONE_OVERDUE',
    'PAYMENT_DELAYED',
  ].includes(eventType);
}


