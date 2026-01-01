import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// GET /api/projects/:id/milestones
router.get('/projects/:id/milestones', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.id },
      include: {
        verificationItems: {
          include: { receipts: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ message: 'Failed to get milestones' });
  }
});

// POST /api/projects/:id/milestones
router.post('/projects/:id/milestones', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, description, amount, escrowId } = req.body;

    const milestone = await prisma.milestone.create({
      data: {
        projectId: req.params.id,
        escrowId,
        name,
        description,
        amount,
        status: 'PENDING',
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: req.params.id,
        eventType: 'MILESTONE_CREATED',
        payload: { milestoneId: milestone.id, name },
      },
    });

    res.status(201).json({ data: milestone });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ message: 'Failed to create milestone' });
  }
});

// POST /api/milestones/:id/evidence
router.post('/:id/evidence', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { verificationItemId, amount, fileUrl } = req.body;

    const receipt = await prisma.receipt.create({
      data: {
        verificationId: verificationItemId,
        amount,
        fileUrl,
      },
    });

    // TODO: Trigger OCR processing
    // await processOCR(receipt.id);

    res.status(201).json({ data: receipt });
  } catch (error) {
    console.error('Upload evidence error:', error);
    res.status(500).json({ message: 'Failed to upload evidence' });
  }
});

// PUT /api/milestones/:id/complete
router.put('/:id/complete', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: milestone.projectId,
        eventType: 'MILESTONE_COMPLETED',
        payload: { milestoneId: milestone.id },
      },
    });

    res.json({ data: milestone });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({ message: 'Failed to complete milestone' });
  }
});

export { router as milestonesRouter };



