import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { mlEngine } from '../services/mlEngine.js';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Run ML processing daily
export function startScheduledJobs() {
  // Daily feature extraction and scoring
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily ML processing...');

    try {
      const activeProjects = await prisma.project.findMany({
        where: {
          status: {
            in: [
              'DESIGN',
              'READINESS',
              'CONTRACT_NEGOTIATION',
              'CONSTRUCTION',
              'PERMIT_SUBMISSION',
            ],
          },
        },
      });

      for (const project of activeProjects) {
        try {
          await mlEngine.extractProjectFeatures(project.id);
          await mlEngine.assessPermitRisk(project.id);
        } catch (error) {
          logger.error(`Error processing project ${project.id}`, { error });
        }
      }

      logger.info(`Processed ${activeProjects.length} projects`);
    } catch (error) {
      logger.error('Error in daily ML processing', { error });
    }
  });

  // Weekly recommendation generation
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Generating weekly recommendations...');

    try {
      const activeProjects = await prisma.project.findMany({
        where: {
          status: {
            in: ['DESIGN', 'READINESS', 'CONTRACT_NEGOTIATION', 'CONSTRUCTION'],
          },
        },
      });

      for (const project of activeProjects) {
        try {
          await mlEngine.generateNextBestAction(project.id);
        } catch (error) {
          logger.error(`Error generating recommendation for ${project.id}`, { error });
        }
      }

      logger.info(`Generated recommendations for ${activeProjects.length} projects`);
    } catch (error) {
      logger.error('Error in weekly recommendation generation', { error });
    }
  });

  // Expire old recommendations
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await prisma.recommendation.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      logger.info(`Expired ${result.count} recommendations`);
    } catch (error) {
      logger.error('Error expiring recommendations', { error });
    }
  });

  logger.info('Scheduled jobs started');
}


