import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// Contractor dashboard metrics
router.get('/dashboard/metrics', requireRole(['PRIME_CONTRACTOR', 'SUBCONTRACTOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get projects where user is contractor (via membership or contract)
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            memberships: {
              some: {
                userId: req.user.id,
                role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
              },
            },
          },
        ],
      },
      include: {
        contracts: {
          include: {
            milestones: {
              include: {
                escrowTransactions: true,
              },
            },
          },
        },
        escrowAgreement: {
          include: {
            transactions: {
              where: {
                transactionType: 'RELEASE',
              },
            },
          },
        },
      },
    });

    const activeStatuses = ['CONSTRUCTION', 'PERMIT_SUBMISSION', 'PERMITTED'];
    const activeProjects = projects.filter((p) => activeStatuses.includes(p.status));

    // Calculate pending payments from milestones
    let pendingPayments = 0;
    projects.forEach((project) => {
      project.contracts.forEach((contract) => {
        contract.milestones.forEach((milestone) => {
          if (milestone.status === 'PENDING' || milestone.status === 'IN_PROGRESS' || milestone.status === 'COMPLETED') {
            if (!milestone.releaseApproved && milestone.amount) {
              pendingPayments += Number(milestone.amount);
            }
          }
        });
      });
    });

    // Calculate upcoming milestones (next 14 days)
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    let upcomingMilestones = 0;
    projects.forEach((project) => {
      project.contracts.forEach((contract) => {
        contract.milestones.forEach((milestone) => {
          // Using createdAt as proxy for scheduled date if no scheduledDate field exists
          if (milestone.completedAt) {
            const milestoneDate = new Date(milestone.completedAt);
            if (milestoneDate > now && milestoneDate < twoWeeksFromNow) {
              upcomingMilestones++;
            }
          }
        });
      });
    });

    const metrics = {
      activeProjects: activeProjects.length,
      totalProjects: projects.length,
      pendingPayments,
      upcomingMilestones,
      outstandingItems: 0, // TODO: Calculate based on punch list or other criteria
    };

    logger.info('Contractor metrics fetched', { userId: req.user.id, metrics });

    res.json({ data: metrics });
  } catch (error) {
    logger.error('Error fetching contractor metrics', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Get contractor projects
router.get('/projects', requireRole(['PRIME_CONTRACTOR', 'SUBCONTRACTOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: req.user.id,
            role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
          },
        },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        property: {
          select: {
            id: true,
            streetAddress: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        contracts: {
          include: {
            milestones: {
              include: {
                escrowTransactions: true,
              },
            },
          },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        escrowAgreement: {
          include: {
            transactions: {
              where: {
                transactionType: 'RELEASE',
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (error) {
    logger.error('Error fetching contractor projects', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get contractor payments
router.get('/payments', requireRole(['PRIME_CONTRACTOR', 'SUBCONTRACTOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: req.user.id,
            role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
          },
        },
      },
      include: {
        escrowAgreement: {
          include: {
            transactions: {
              include: {
                milestone: true,
              },
            },
          },
        },
        contracts: {
          include: {
            milestones: true,
          },
        },
      },
    });

    const payments: any[] = [];
    
    projects.forEach((project) => {
      if (project.escrowAgreement) {
        project.escrowAgreement.transactions.forEach((transaction) => {
          payments.push({
            id: transaction.id,
            projectId: project.id,
            projectName: project.name,
            amount: transaction.amount,
            status: transaction.status,
            milestone: transaction.milestone,
            createdAt: transaction.createdAt,
            completedAt: transaction.completedAt,
          });
        });
      }
    });

    res.json({ data: payments });
  } catch (error) {
    logger.error('Error fetching contractor payments', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Generate subcontractor invite (prime only, major projects only)
router.post(
  '/projects/:projectId/invite-subcontractor',
  requireRole(['PRIME_CONTRACTOR']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const { email, trade, scope } = req.body;

      // Verify project exists and user is PM or contractor
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            {
              memberships: {
                some: {
                  userId: req.user.id,
                  role: 'PRIME_CONTRACTOR',
                },
              },
            },
          ],
        },
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found or unauthorized' });
      }

      // CRITICAL: Verify project complexity is MAJOR
      if (project.complexity !== 'MAJOR') {
        return res.status(403).json({
          message: 'Subcontractor management only available for MAJOR complexity projects',
        });
      }

      // Generate invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');

      // Create invite
      const invite = await prisma.subcontractorInvite.create({
        data: {
          projectId,
          invitedById: req.user.id,
          email,
          trade: trade || 'GENERAL',
          scope: scope || undefined,
          token: inviteToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'PENDING',
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          invitedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // TODO: Send email with invite link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const inviteLink = `${frontendUrl}/register/subcontractor?token=${inviteToken}`;

      logger.info('Subcontractor invite created', {
        inviteId: invite.id,
        projectId,
        email,
        userId: req.user.id,
      });

      res.status(201).json({
        data: {
          invite,
          inviteLink,
        },
      });
    } catch (error) {
      logger.error('Error creating subcontractor invite', {
        error,
        projectId: req.params.projectId,
        userId: req.user?.id,
      });
      res.status(500).json({ message: 'Failed to create invite' });
    }
  }
);

// Get subcontractor invites for project
router.get(
  '/projects/:projectId/invites',
  requireRole(['PRIME_CONTRACTOR']),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;

      const invites = await prisma.subcontractorInvite.findMany({
        where: {
          projectId,
          invitedById: req.user.id,
        },
        include: {
          acceptedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ data: invites });
    } catch (error) {
      logger.error('Error fetching invites', { error, projectId: req.params.projectId });
      res.status(500).json({ message: 'Failed to fetch invites' });
    }
  }
);

// Get invoices
router.get('/invoices', requireRole(['PRIME_CONTRACTOR', 'SUBCONTRACTOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // For now, invoices are represented by milestone payment requests
    // TODO: Create Invoice model if needed
    const projects = await prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: req.user.id,
            role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
          },
        },
      },
      include: {
        contracts: {
          include: {
            milestones: {
              include: {
                escrowTransactions: true,
              },
            },
          },
        },
      },
    });

    const invoices: any[] = [];

    projects.forEach((project) => {
      project.contracts.forEach((contract) => {
        contract.milestones.forEach((milestone) => {
          if (milestone.amount) {
            invoices.push({
              id: `invoice-${milestone.id}`,
              projectId: project.id,
              projectName: project.name,
              milestoneId: milestone.id,
              milestoneName: milestone.name,
              amount: milestone.amount,
              status: milestone.status,
              releaseApproved: milestone.releaseApproved,
              releasedAt: milestone.releasedAt,
              createdAt: milestone.createdAt,
            });
          }
        });
      });
    });

    res.json({ data: invoices });
  } catch (error) {
    logger.error('Error fetching invoices', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

export { router as contractorRouter };

