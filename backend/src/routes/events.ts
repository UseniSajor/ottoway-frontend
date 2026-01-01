import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// POST /api/events
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, eventType, payload, metadata } = req.body;

    if (!projectId || !eventType || !payload) {
      return res.status(400).json({ message: 'projectId, eventType, and payload are required' });
    }

    const event = await prisma.projectEvent.create({
      data: {
        projectId,
        eventType,
        payload,
        metadata,
      },
    });

    res.status(201).json({ data: event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});


export { router as eventsRouter };

