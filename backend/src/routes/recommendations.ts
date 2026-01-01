import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// POST /api/recommendations/:id/accept
router.post('/:id/accept', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recommendation = await prisma.recommendation.update({
      where: { id: req.params.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    res.json({ data: recommendation });
  } catch (error) {
    console.error('Accept recommendation error:', error);
    res.status(500).json({ message: 'Failed to accept recommendation' });
  }
});

// POST /api/recommendations/:id/label
router.post('/:id/label', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { label, notes } = req.body;

    if (!label) {
      return res.status(400).json({ message: 'label is required' });
    }

    const feedbackLabel = await prisma.feedbackLabel.create({
      data: {
        recommendationId: req.params.id,
        userId: req.user.id,
        label,
        notes,
      },
    });

    res.status(201).json({ data: feedbackLabel });
  } catch (error) {
    console.error('Label recommendation error:', error);
    res.status(500).json({ message: 'Failed to label recommendation' });
  }
});

export { router as recommendationsRouter };

