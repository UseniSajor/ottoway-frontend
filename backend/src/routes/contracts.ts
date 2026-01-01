import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// GET /api/projects/:id/contract
router.get('/projects/:id/contract', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const contract = await prisma.contractAgreement.findFirst({
      where: { projectId: req.params.id },
      include: { signatures: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json({ data: contract });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ message: 'Failed to get contract' });
  }
});

// POST /api/projects/:id/contracts
router.post('/projects/:id/contracts', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { contractUrl } = req.body;

    const contract = await prisma.contractAgreement.create({
      data: {
        projectId: req.params.id,
        status: 'DRAFT',
        contractUrl,
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: req.params.id,
        eventType: 'CONTRACT_CREATED',
        payload: { contractId: contract.id },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CONTRACT_CREATED',
        resource: 'ContractAgreement',
        resourceId: contract.id,
      },
    });

    res.status(201).json({ data: contract });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ message: 'Failed to create contract' });
  }
});

// POST /api/contracts/:id/send-for-signature
router.post('/:id/send-for-signature', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const contract = await prisma.contractAgreement.update({
      where: { id: req.params.id },
      data: { status: 'PENDING_SIGNATURES' },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: contract.projectId,
        eventType: 'CONTRACT_SENT_FOR_SIGNATURE',
        payload: { contractId: contract.id },
      },
    });

    res.json({ data: contract });
  } catch (error) {
    console.error('Send for signature error:', error);
    res.status(500).json({ message: 'Failed to send contract for signature' });
  }
});

// POST /api/contracts/:id/sign
router.post('/:id/sign', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const contract = await prisma.contractAgreement.findUnique({
      where: { id: req.params.id },
      include: { signatures: true },
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check if already signed
    const existingSignature = contract.signatures.find((s) => s.userId === req.user.id);
    if (existingSignature) {
      return res.status(400).json({ message: 'Contract already signed by this user' });
    }

    // Create signature
    await prisma.signature.create({
      data: {
        contractId: req.params.id,
        userId: req.user.id,
        signedAt: new Date(),
      },
    });

    // Check if all required signatures are complete
    // TODO: Determine required signers based on project/contract
    const allSigned = contract.signatures.length + 1 >= 2; // Example: require 2 signatures

    if (allSigned) {
      await prisma.contractAgreement.update({
        where: { id: req.params.id },
        data: { status: 'FULLY_SIGNED' },
      });

      // Log event
      await prisma.projectEvent.create({
        data: {
          projectId: contract.projectId,
          eventType: 'CONTRACT_FULLY_SIGNED',
          payload: { contractId: contract.id },
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CONTRACT_SIGNED',
        resource: 'ContractAgreement',
        resourceId: req.params.id,
      },
    });

    res.json({ data: { signed: true, fullySigned: allSigned } });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ message: 'Failed to sign contract' });
  }
});

export { router as contractsRouter };



