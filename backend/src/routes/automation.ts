import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { MLService } from '../services/mlService';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// GET /api/automation/rules
router.get('/rules', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rules = await prisma.automationRule.findMany({
      include: { actions: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: rules });
  } catch (error) {
    console.error('Get automation rules error:', error);
    res.status(500).json({ message: 'Failed to get automation rules' });
  }
});

// POST /api/automation/rules
router.post('/rules', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, description, trigger, conditions } = req.body;

    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        trigger,
        conditions,
        enabled: true,
      },
    });

    res.status(201).json({ data: rule });
  } catch (error) {
    console.error('Create automation rule error:', error);
    res.status(500).json({ message: 'Failed to create automation rule' });
  }
});

// PUT /api/automation/rules/:id
router.put('/rules/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rule = await prisma.automationRule.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: rule });
  } catch (error) {
    console.error('Update automation rule error:', error);
    res.status(500).json({ message: 'Failed to update automation rule' });
  }
});

// PUT /api/automation/rules/:id/toggle
router.put('/rules/:id/toggle', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rule = await prisma.automationRule.findUnique({
      where: { id: req.params.id },
    });

    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    const updated = await prisma.automationRule.update({
      where: { id: req.params.id },
      data: { enabled: !rule.enabled },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Toggle automation rule error:', error);
    res.status(500).json({ message: 'Failed to toggle automation rule' });
  }
});

// DELETE /api/automation/rules/:id
router.delete('/rules/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await prisma.automationRule.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('Delete automation rule error:', error);
    res.status(500).json({ message: 'Failed to delete automation rule' });
  }
});

// POST /api/automation/execute (with guardrails)
router.post('/execute', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { ruleId, actionType, parameters, requiresHumanConfirmation } = req.body;

    // Guardrail: Check if action requires human confirmation
    if (MLService.requiresHumanConfirmation(actionType) && !requiresHumanConfirmation) {
      return res.status(400).json({
        message: 'AUTOMATION_BLOCKED: This action requires human confirmation',
      });
    }

    const action = await MLService.executeAutomationAction(
      ruleId,
      actionType,
      parameters,
      requiresHumanConfirmation
    );

    res.json({ data: action });
  } catch (error: any) {
    console.error('Execute automation error:', error);
    if (error.message?.includes('AUTOMATION_BLOCKED')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to execute automation action' });
  }
});

export { router as automationRouter };



