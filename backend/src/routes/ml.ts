import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// Log project event
router.post('/events', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, eventType, eventData } = req.body;

    const event = await prisma.projectEvent.create({
      data: {
        projectId,
        eventType,
        eventData: eventData || {},
        userId: req.user.id,
      },
    });

    // Trigger async feature extraction and ML processing
    // (In production, use queue like BullMQ)
    setTimeout(() => processEvent(event.id), 0);

    res.status(201).json({ data: event });
  } catch (error) {
    logger.error('Error logging event', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to log event' });
  }
});

// Get events for project
router.get('/projects/:projectId/events', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const events = await prisma.projectEvent.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({ data: events });
  } catch (error) {
    logger.error('Error fetching events', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get all events (admin only)
router.get('/events', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { eventType, projectId, limit = 100, offset = 0 } = req.query;

    const where: any = {};
    if (eventType) {
      where.eventType = eventType;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const events = await prisma.projectEvent.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({ data: events });
  } catch (error) {
    logger.error('Error fetching events', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get recommendations for project
router.get('/projects/:projectId/recommendations', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const { status } = req.query;

    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      include: {
        modelScore: {
          select: {
            modelName: true,
            score: true,
            confidence: true,
          },
        },
        acceptedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        rejectedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        feedbackLabels: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ data: recommendations });
  } catch (error) {
    logger.error('Error fetching recommendations', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});

// Get all recommendations (admin only)
router.get('/recommendations', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { status, type, projectId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        modelScore: {
          select: {
            modelName: true,
            score: true,
            confidence: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ data: recommendations });
  } catch (error) {
    logger.error('Error fetching recommendations', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});

// Accept recommendation
router.post('/recommendations/:id/accept', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedById: req.user.id,
      },
      include: {
        acceptedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({ data: recommendation });
  } catch (error) {
    logger.error('Error accepting recommendation', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to accept recommendation' });
  }
});

// Reject recommendation
router.post('/recommendations/:id/reject', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: req.user.id,
      },
    });

    res.json({ data: recommendation });
  } catch (error) {
    logger.error('Error rejecting recommendation', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to reject recommendation' });
  }
});

// Add feedback label to recommendation
router.post('/recommendations/:id/label', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { label, comment, wasImplemented, implementationOutcome } = req.body;

    const feedback = await prisma.feedbackLabel.create({
      data: {
        recommendationId: id,
        userId: req.user.id,
        label,
        comment,
        wasImplemented,
        implementationOutcome,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({ data: feedback });
  } catch (error) {
    logger.error('Error adding feedback', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to add feedback' });
  }
});

// Get model scores for project
router.get('/projects/:projectId/scores', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const { modelName } = req.query;

    const where: any = { projectId };
    if (modelName) {
      where.modelName = modelName;
    }

    const scores = await prisma.modelScore.findMany({
      where,
      include: {
        recommendations: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ data: scores });
  } catch (error) {
    logger.error('Error fetching scores', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
});

// Get all scores (admin only)
router.get('/scores', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { modelName, projectId } = req.query;

    const where: any = {};
    if (modelName) {
      where.modelName = modelName;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const scores = await prisma.modelScore.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ data: scores });
  } catch (error) {
    logger.error('Error fetching scores', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
});

// Generate recommendation using Claude (MASTER_SPEC: Anthropic Claude Sonnet 4)
router.post(
  '/projects/:projectId/generate-recommendation',
  requireRole(['ADMIN', 'PLATFORM_OPERATOR']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;

      // Gather project context
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          contracts: {
            include: {
              milestones: true,
            },
          },
          designVersions: true,
          readinessChecklist: {
            include: {
              items: true,
            },
          },
          mlFeatureSnapshots: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          modelScores: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Build context for Claude
      const context = {
        projectType: project.projectType,
        category: project.category,
        complexity: project.complexity,
        status: project.status,
        contracts: project.contracts.length,
        fullySignedContracts: project.contracts.filter((c) => c.status === 'FULLY_SIGNED').length,
        approvedDesigns: project.designVersions.filter((d) => d.status === 'APPROVED_FOR_PERMIT').length,
        readinessComplete:
          project.readinessChecklist?.items.filter((i) => i.status === 'COMPLETED').length || 0,
        readinessTotal: project.readinessChecklist?.items.length || 0,
        recentScores: project.modelScores.map((s) => ({
          type: s.modelName || s.modelType,
          score: s.score,
          riskLevel: s.riskLevel,
        })),
      };

      // For now, create a mock recommendation without Claude API
      // TODO: Integrate Claude API when ANTHROPIC_API_KEY is available
      const recommendationData = {
        type: 'NEXT_ACTION',
        title: 'Complete Readiness Checklist',
        description: 'Focus on completing remaining readiness items to move forward with permit submission.',
        priority: 7,
        reasoning: { explanation: 'Based on project status and readiness completion rate' },
        confidence: 0.75,
        estimatedImpact: 'HIGH',
        estimatedEffort: 'MEDIUM',
      };

      // Create recommendation
      const recommendation = await prisma.recommendation.create({
        data: {
          projectId,
          type: recommendationData.type,
          title: recommendationData.title,
          description: recommendationData.description,
          priority: recommendationData.priority,
          reasoning: recommendationData.reasoning,
          confidence: recommendationData.confidence,
          estimatedImpact: recommendationData.estimatedImpact,
          estimatedEffort: recommendationData.estimatedEffort,
          status: 'ACTIVE',
        },
      });

      logger.info('Recommendation generated', {
        recommendationId: recommendation.id,
        projectId,
        userId: req.user.id,
      });

      res.status(201).json({ data: recommendation });
    } catch (error) {
      logger.error('Error generating recommendation', { error, userId: req.user?.id });
      res.status(500).json({ message: 'Failed to generate recommendation' });
    }
  }
);

// Get automation actions awaiting approval
router.get(
  '/automation-actions/pending',
  requireRole(['ADMIN', 'PLATFORM_OPERATOR']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const actions = await prisma.automationAction.findMany({
        where: {
          status: 'AWAITING_APPROVAL',
          requiresApproval: true,
        },
        include: {
          rule: true,
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ data: actions });
    } catch (error) {
      logger.error('Error fetching pending actions', { error, userId: req.user?.id });
      res.status(500).json({ message: 'Failed to fetch pending actions' });
    }
  }
);

// Approve automation action (CRITICAL: human in loop)
router.post(
  '/automation-actions/:id/approve',
  requireRole(['ADMIN', 'PLATFORM_OPERATOR']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;

      const action = await prisma.automationAction.update({
        where: { id },
        data: {
          status: 'APPROVED',
          humanApproval: true,
          approvedById: req.user.id,
          approvedAt: new Date(),
        },
      });

      // Execute action (in background)
      setTimeout(() => executeAutomationAction(action.id), 0);

      logger.info('Automation action approved', {
        actionId: id,
        userId: req.user.id,
      });

      res.json({ data: action });
    } catch (error) {
      logger.error('Error approving action', { error, userId: req.user?.id });
      res.status(500).json({ message: 'Failed to approve action' });
    }
  }
);

// Reject automation action
router.post(
  '/automation-actions/:id/reject',
  requireRole(['ADMIN', 'PLATFORM_OPERATOR']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const action = await prisma.automationAction.update({
        where: { id },
        data: {
          status: 'REJECTED',
          humanApproval: false,
          approvedById: req.user.id,
          approvedAt: new Date(),
          rejectionReason: reason,
        },
      });

      res.json({ data: action });
    } catch (error) {
      logger.error('Error rejecting action', { error, userId: req.user?.id });
      res.status(500).json({ message: 'Failed to reject action' });
    }
  }
);

// Get automation rules
router.get('/automation-rules', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rules = await prisma.automationRule.findMany({
      include: {
        executionLog: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: rules });
  } catch (error) {
    logger.error('Error fetching automation rules', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch automation rules' });
  }
});

async function executeAutomationAction(actionId: string) {
  // TODO: Execute approved automation action
  logger.info('Executing automation action', { actionId });
}

export { router as mlRouter };

