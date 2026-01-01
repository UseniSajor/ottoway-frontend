import { Router } from 'express';
import { PrismaClient, EscrowStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { enforceEscrowReleaseRules } from '../middleware/workflowRules.js';
import { logAuditEvent } from '../services/auditLogger.js';
import { createNotification } from '../services/notificationService.js';
import Stripe from 'stripe';
import multer from 'multer';
import { storage } from '../services/storage';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  logger.warn('STRIPE_SECRET_KEY not set - Stripe features will be disabled');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })
  : null;

// Configure multer for receipt uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only JPEG, PNG, and PDF files allowed for receipts', 'INVALID_FILE_TYPE'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

// Create Stripe Connect account for contractor
router.post('/stripe/connect-account', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured' });
    }

    // Check if account already exists
    let existingAccount = await prisma.stripeConnectAccount.findUnique({
      where: { userId: req.user.id },
    });

    if (existingAccount) {
      return res.json({ data: existingAccount });
    }

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: req.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: req.user.id,
      },
    });

    // Save to database
    const connectAccount = await prisma.stripeConnectAccount.create({
      data: {
        userId: req.user.id,
        stripeAccountId: account.id,
        accountType: 'express',
        country: account.country || 'US',
        email: account.email || req.user.email,
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
      },
    });

    logger.info('Stripe Connect account created', {
      userId: req.user.id,
      stripeAccountId: account.id,
    });

    res.status(201).json({ data: connectAccount });
  } catch (error) {
    logger.error('Error creating Stripe account', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to create Stripe account' });
  }
});

// Get account link for onboarding
router.post('/stripe/account-link', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured' });
    }

    const account = await prisma.stripeConnectAccount.findUnique({
      where: { userId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ message: 'Stripe account not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: account.stripeAccountId,
      refresh_url: `${frontendUrl}/owner/escrow/refresh`,
      return_url: `${frontendUrl}/owner/escrow/return`,
      type: 'account_onboarding',
    });

    res.json({ data: { url: accountLink.url } });
  } catch (error) {
    logger.error('Error creating account link', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to create account link' });
  }
});

// Create escrow agreement
router.post('/projects/:projectId/escrow', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const { totalAmount, payeeId, contractId } = req.body;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.user.id },
          {
            members: {
              some: { userId: req.user.id },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const escrow = await prisma.escrowAgreement.create({
      data: {
        projectId,
        totalAmount: parseFloat(totalAmount),
        payerId: req.user.id,
        payeeId,
        contractId: contractId || undefined,
        status: EscrowStatus.DRAFT,
      },
      include: {
        payer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        payee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        contract: {
          select: { id: true, contractName: true },
        },
      },
    });

    logger.info('Escrow agreement created', {
      escrowId: escrow.id,
      projectId,
      payerId: req.user.id,
      payeeId,
    });

    res.status(201).json({ data: escrow });
  } catch (error) {
    logger.error('Error creating escrow', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to create escrow' });
  }
});

// Get escrow for project
router.get('/projects/:projectId/escrow', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.user.id },
          {
            members: {
              some: { userId: req.user.id },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const escrow = await prisma.escrowAgreement.findUnique({
      where: { projectId },
      include: {
        payer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        payee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            stripeConnectAccount: true,
          },
        },
        contract: {
          include: {
            milestones: {
              include: {
                escrowTransactions: {
                  include: {
                    receipts: true,
                  },
                },
              },
            },
          },
        },
        stripeAccount: true,
        transactions: {
          include: {
            milestone: {
              select: { id: true, name: true, amount: true },
            },
            releaseRequestedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            approvedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            rejectedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            receipts: {
              include: {
                uploadedBy: {
                  select: { id: true, firstName: true, lastName: true },
                },
                verifiedBy: {
                  select: { id: true, firstName: true, lastName: true },
                },
                ocrResult: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!escrow) {
      return res.status(404).json({ message: 'Escrow not found' });
    }

    res.json({ data: escrow });
  } catch (error) {
    logger.error('Error fetching escrow', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch escrow' });
  }
});

// Fund escrow (Stripe payment)
router.post('/escrow/:escrowId/fund', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured' });
    }

    const { escrowId } = req.params;
    const { paymentMethodId } = req.body;

    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      return res.status(404).json({ message: 'Escrow not found' });
    }

    if (escrow.payerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(escrow.totalAmount) * 100), // Convert to cents
      currency: escrow.currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        escrowId: escrow.id,
        projectId: escrow.projectId,
      },
    });

    // Update escrow
    const updated = await prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        funded: true,
        fundedAt: new Date(),
        fundedAmount: escrow.totalAmount,
        status: EscrowStatus.FUNDED,
      },
    });

    // Create deposit transaction
    await prisma.escrowTransaction.create({
      data: {
        escrowAgreementId: escrowId,
        transactionType: TransactionType.DEPOSIT,
        amount: escrow.totalAmount,
        currency: escrow.currency,
        status: TransactionStatus.COMPLETED,
        stripePaymentId: paymentIntent.id,
        description: 'Initial escrow funding',
        completedAt: new Date(),
      },
    });

    logger.info('Escrow funded', {
      escrowId,
      amount: escrow.totalAmount,
      paymentIntentId: paymentIntent.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error funding escrow', { error, escrowId: req.params.escrowId });
    res.status(500).json({ message: 'Failed to fund escrow' });
  }
});

// Request milestone release
router.post('/milestones/:milestoneId/request-release', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { milestoneId } = req.params;
    const { notes } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: {
              include: {
                escrowAgreement: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (!milestone.contract?.project.escrowAgreement) {
      return res.status(400).json({ message: 'No escrow agreement for this project' });
    }

    if (!milestone.amount) {
      return res.status(400).json({ message: 'Milestone has no amount' });
    }

    // Create release transaction
    const transaction = await prisma.escrowTransaction.create({
      data: {
        escrowAgreementId: milestone.contract.project.escrowAgreement.id,
        transactionType: TransactionType.RELEASE,
        amount: milestone.amount,
        currency: milestone.contract.project.escrowAgreement.currency,
        milestoneId: milestone.id,
        status: TransactionStatus.VERIFICATION_REQUIRED,
        releaseRequested: true,
        releaseRequestedAt: new Date(),
        releaseRequestedById: req.user.id,
        description: `Release for milestone: ${milestone.name}`,
        notes: notes || undefined,
      },
      include: {
        milestone: {
          select: { id: true, name: true, amount: true },
        },
        releaseRequestedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Milestone release requested', {
      transactionId: transaction.id,
      milestoneId,
      userId: req.user.id,
    });

    res.status(201).json({ data: transaction });
  } catch (error) {
    logger.error('Error requesting release', { error, milestoneId: req.params.milestoneId });
    res.status(500).json({ message: 'Failed to request release' });
  }
});

// Upload receipt for verification
router.post(
  '/transactions/:transactionId/receipts',
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { transactionId } = req.params;
      const { vendor, receiptDate, amount, description, category } = req.body;

      // Verify transaction access
      const transaction = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId },
        include: {
          escrowAgreement: {
            include: {
              project: {
                select: {
                  ownerId: true,
                  members: {
                    where: { userId: req.user.id },
                  },
                },
              },
            },
          },
        },
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      const hasAccess =
        transaction.escrowAgreement.project.ownerId === req.user.id ||
        transaction.escrowAgreement.project.members.length > 0 ||
        req.user.role === 'ADMIN';

      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Upload file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = req.file.originalname.split('.').pop();
      const key = `receipts/${transactionId}/${timestamp}-${random}.${extension}`;

      const fileUrl = await storage.upload(req.file.buffer, key, req.file.mimetype);

      const receipt = await prisma.receipt.create({
        data: {
          transactionId,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          fileUrl,
          vendor: vendor || undefined,
          receiptDate: receiptDate ? new Date(receiptDate) : undefined,
          amount: amount ? parseFloat(amount) : undefined,
          description: description || undefined,
          category: category || undefined,
          uploadedById: req.user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // TODO: Trigger OCR processing here (async job)

      logger.info('Receipt uploaded', {
        receiptId: receipt.id,
        transactionId,
        userId: req.user.id,
      });

      res.status(201).json({ data: receipt });
    } catch (error) {
      logger.error('Error uploading receipt', { error, transactionId: req.params.transactionId });
      res.status(500).json({ message: 'Failed to upload receipt' });
    }
  }
);

// Verify receipt (admin/owner)
router.post('/receipts/:receiptId/verify', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { receiptId } = req.params;
    const { verified, notes } = req.body;

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        transaction: {
          include: {
            escrowAgreement: {
              include: {
                project: {
                  select: {
                    ownerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Only owner or admin can verify
    const canVerify =
      receipt.transaction.escrowAgreement.project.ownerId === req.user.id ||
      req.user.role === 'ADMIN';

    if (!canVerify) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        verified: verified === true,
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        verificationNotes: notes || undefined,
      },
      include: {
        verifiedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Log verification
    await prisma.receiptVerificationLog.create({
      data: {
        receiptId,
        verifiedById: req.user.id,
        action: verified === true ? 'APPROVED' : 'REJECTED',
        notes: notes || undefined,
      },
    });

    // Check if all receipts verified for transaction
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: receipt.transactionId },
      include: {
        receipts: true,
      },
    });

    const allVerified = transaction?.receipts.every((r) => r.verified) && transaction.receipts.length > 0;

    if (allVerified && transaction) {
      await prisma.escrowTransaction.update({
        where: { id: transaction.id },
        data: {
          verificationComplete: true,
          status: TransactionStatus.PENDING_APPROVAL,
        },
      });
    }

    logger.info('Receipt verified', {
      receiptId,
      verified,
      userId: req.user.id,
    });

    res.json({ data: updatedReceipt });
  } catch (error) {
    logger.error('Error verifying receipt', { error, receiptId: req.params.receiptId });
    res.status(500).json({ message: 'Failed to verify receipt' });
  }
});

// Approve release (owner/admin)
router.post('/transactions/:transactionId/approve', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured' });
    }

    const { transactionId } = req.params;
    const { notes } = req.body;

    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        escrowAgreement: {
          include: {
            payee: {
              include: {
                stripeConnectAccount: true,
              },
            },
          },
        },
        milestone: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== TransactionStatus.PENDING_APPROVAL) {
      return res.status(400).json({ message: 'Transaction not ready for approval' });
    }

    if (!transaction.verificationComplete) {
      return res.status(400).json({ message: 'Verification not complete' });
    }

    // ENFORCE WORKFLOW RULES
    try {
      await enforceEscrowReleaseRules(transactionId);
    } catch (error: any) {
      return res.status(403).json({
        message: 'Escrow release blocked',
        error: error.message,
      });
    }

    // Verify authorization
    const canApprove =
      transaction.escrowAgreement.payerId === req.user.id || req.user.role === 'ADMIN';

    if (!canApprove) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Execute Stripe transfer to contractor
    const payeeAccount = transaction.escrowAgreement.payee.stripeConnectAccount;

    if (!payeeAccount) {
      return res.status(400).json({ message: 'Payee has no Stripe account' });
    }

    if (!payeeAccount.payoutsEnabled) {
      return res.status(400).json({ message: 'Payee Stripe account not fully set up' });
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(transaction.amount) * 100),
      currency: transaction.currency.toLowerCase(),
      destination: payeeAccount.stripeAccountId,
      metadata: {
        transactionId: transaction.id,
        milestoneId: transaction.milestoneId || '',
      },
    });

    // Update transaction
    const updated = await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.COMPLETED,
        approvedById: req.user.id,
        approvedAt: new Date(),
        approvalNotes: notes || undefined,
        completedAt: new Date(),
        stripeTransferId: transfer.id,
      },
      include: {
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Update milestone status
    if (transaction.milestoneId) {
      await prisma.milestone.update({
        where: { id: transaction.milestoneId },
        data: {
          status: 'PAID',
          releaseApproved: true,
          releasedAt: new Date(),
          releasedById: req.user.id,
        },
      });
    }

    logger.info('Release approved and transferred', {
      transactionId,
      transferId: transfer.id,
      amount: transaction.amount,
      userId: req.user.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error approving release', { error, transactionId: req.params.transactionId });
    res.status(500).json({ message: 'Failed to approve release' });
  }
});

// Reject release
router.post('/transactions/:transactionId/reject', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        escrowAgreement: {
          include: {
            project: {
              select: {
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Only payer or admin can reject
    const canReject =
      transaction.escrowAgreement.payerId === req.user.id || req.user.role === 'ADMIN';

    if (!canReject) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updated = await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.REJECTED,
        rejectedById: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason || undefined,
      },
      include: {
        rejectedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Release rejected', {
      transactionId,
      reason,
      userId: req.user.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error rejecting release', { error, transactionId: req.params.transactionId });
    res.status(500).json({ message: 'Failed to reject release' });
  }
});

export { router as escrowRouter };
