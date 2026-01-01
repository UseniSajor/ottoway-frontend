import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PermitService } from '../services/permitService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/projects/:id/permits
router.get('/projects/:id/permits', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const permit = await prisma.permitSet.findFirst({
      where: { projectId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    // Check blocking status
    const check = await PermitService.checkPermitSubmission(req.params.id);

    res.json({
      data: {
        ...permit,
        blockingReasons: check.blockingReasons,
        canSubmit: check.allowed,
      },
    });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(500).json({ message: 'Failed to get permit' });
  }
});

// POST /api/projects/:id/permits/submit
router.post('/projects/:id/permits/submit', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const permit = await PermitService.submitPermit(req.params.id, req.user.id);

    res.status(201).json({ data: permit });
  } catch (error: any) {
    console.error('Submit permit error:', error);
    if (error.message === 'PERMIT_BLOCKED') {
      const check = await PermitService.checkPermitSubmission(req.params.id);
      return res.status(400).json({
        message: 'Permit submission is blocked',
        blockingReasons: check.blockingReasons,
      });
    }
    res.status(500).json({ message: 'Failed to submit permit' });
  }
});

export { router as permitsRouter };



