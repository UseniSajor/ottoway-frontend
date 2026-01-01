import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// Admin dashboard metrics
router.get('/dashboard/metrics', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [
      totalUsers,
      totalProjects,
      activeProjects,
      pendingContractors,
      activeDisputes,
      totalEscrowValue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.project.count({
        where: {
          status: {
            in: ['DESIGN', 'READINESS', 'CONSTRUCTION', 'PERMIT_SUBMISSION', 'PERMITTED'],
          },
        },
      }),
      prisma.user.count({
        where: {
          role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
          approvalStatus: 'PENDING',
        },
      }),
      prisma.dispute.count({
        where: {
          status: { in: ['OPEN', 'IN_REVIEW'] },
        },
      }),
      prisma.escrowAgreement.aggregate({
        _sum: {
          fundedAmount: true,
        },
        where: {
          funded: true,
        },
      }),
    ]);

    res.json({
      data: {
        totalUsers,
        totalProjects,
        activeProjects,
        pendingContractors,
        activeDisputes,
        totalEscrowValue: totalEscrowValue._sum.fundedAmount || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin metrics', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Get activity feed
router.get('/activity', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [recentUsers, recentProjects, recentTransactions] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.escrowTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          transactionType: true,
          createdAt: true,
        },
      }),
    ]);

    const activity = [
      ...recentUsers.map((u) => ({
        type: 'USER_REGISTRATION',
        description: `${u.firstName} ${u.lastName} (${u.role}) registered`,
        timestamp: u.createdAt,
      })),
      ...recentProjects.map((p) => ({
        type: 'PROJECT_CREATED',
        description: `Project "${p.name}" created`,
        timestamp: p.createdAt,
      })),
      ...recentTransactions.map((t) => ({
        type: 'TRANSACTION',
        description: `${t.transactionType} transaction: $${t.amount}`,
        timestamp: t.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    res.json({ data: activity });
  } catch (error) {
    logger.error('Error fetching activity', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
});

// Get alerts
router.get('/alerts', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [pendingApprovals, openDisputes, flaggedTransactions] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
          approvalStatus: 'PENDING',
        },
        take: 10,
      }),
      prisma.dispute.findMany({
        where: {
          status: { in: ['OPEN', 'IN_REVIEW', 'ESCALATED'] },
          priority: { in: ['HIGH', 'CRITICAL'] },
        },
        take: 10,
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.escrowTransaction.findMany({
        where: {
          status: 'PENDING_APPROVAL',
        },
        take: 10,
      }),
    ]);

    const alerts: any[] = [];

    pendingApprovals.forEach((user) => {
      alerts.push({
        type: 'PENDING_APPROVAL',
        priority: 'HIGH',
        message: `Contractor ${user.firstName} ${user.lastName} awaiting approval`,
        userId: user.id,
        createdAt: user.createdAt,
      });
    });

    openDisputes.forEach((dispute) => {
      alerts.push({
        type: 'OPEN_DISPUTE',
        priority: dispute.priority,
        message: `Dispute: ${dispute.title} (${dispute.project.name})`,
        disputeId: dispute.id,
        createdAt: dispute.createdAt,
      });
    });

    flaggedTransactions.forEach((transaction) => {
      alerts.push({
        type: 'PENDING_APPROVAL',
        priority: 'MEDIUM',
        message: `Transaction requires approval: $${transaction.amount}`,
        transactionId: transaction.id,
        createdAt: transaction.createdAt,
      });
    });

    res.json({ data: alerts });
  } catch (error) {
    logger.error('Error fetching alerts', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
});

// Get all users
router.get('/users', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role, status, search } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.approvalStatus = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: users });
  } catch (error) {
    logger.error('Error fetching users', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:id', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        complianceDocuments: true,
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    logger.error('Error fetching user', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
router.patch('/users/:id', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role, approvalStatus, ...otherFields } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(approvalStatus && {
          approvalStatus,
          ...(approvalStatus === 'APPROVED' && {
            approvedAt: new Date(),
            approvedById: req.user.id,
          }),
          ...(approvalStatus === 'REJECTED' && {
            rejectedAt: new Date(),
          }),
        }),
        ...otherFields,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER',
        resource: 'USER',
        resourceId: user.id,
        details: { changes: req.body },
      },
    });

    res.json({ data: user });
  } catch (error) {
    logger.error('Error updating user', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get pending contractors
router.get('/contractors/pending', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const contractors = await prisma.user.findMany({
      where: {
        role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
        approvalStatus: 'PENDING',
      },
      include: {
        complianceDocuments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: contractors });
  } catch (error) {
    logger.error('Error fetching pending contractors', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch contractors' });
  }
});

// Get all contractors
router.get('/contractors', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const contractors = await prisma.user.findMany({
      where: {
        role: { in: ['PRIME_CONTRACTOR', 'SUBCONTRACTOR'] },
      },
      include: {
        complianceDocuments: true,
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: {
            ownedProjects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: contractors });
  } catch (error) {
    logger.error('Error fetching contractors', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch contractors' });
  }
});

// Approve contractor
router.post('/contractors/:id/approve', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const contractor = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: req.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'APPROVE_CONTRACTOR',
        resource: 'USER',
        resourceId: id,
        details: { notes },
      },
    });

    res.json({ data: contractor });
  } catch (error) {
    logger.error('Error approving contractor', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to approve contractor' });
  }
});

// Reject contractor
router.post('/contractors/:id/reject', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const contractor = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'REJECT_CONTRACTOR',
        resource: 'USER',
        resourceId: id,
        details: { reason },
      },
    });

    res.json({ data: contractor });
  } catch (error) {
    logger.error('Error rejecting contractor', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to reject contractor' });
  }
});

// Get all projects
router.get('/projects', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (error) {
    logger.error('Error fetching projects', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get escrow overview
router.get('/escrow/overview', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [totalFunds, pendingReleases, transactions] = await Promise.all([
      prisma.escrowAgreement.aggregate({
        _sum: {
          fundedAmount: true,
        },
        where: {
          funded: true,
        },
      }),
      prisma.escrowTransaction.count({
        where: {
          status: 'PENDING_APPROVAL',
        },
      }),
      prisma.escrowTransaction.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          escrowAgreement: {
            include: {
              project: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    res.json({
      data: {
        totalFunds: totalFunds._sum.fundedAmount || 0,
        pendingReleases,
        transactions,
      },
    });
  } catch (error) {
    logger.error('Error fetching escrow overview', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch escrow overview' });
  }
});

// Get disputes
router.get('/disputes', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { status, priority } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        filedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        against: {
          select: { id: true, firstName: true, lastName: true },
        },
        evidence: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ data: disputes });
  } catch (error) {
    logger.error('Error fetching disputes', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch disputes' });
  }
});

// Get dispute details
router.get('/disputes/:id', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        filedBy: true,
        against: true,
        evidence: {
          include: {
            submittedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    res.json({ data: dispute });
  } catch (error) {
    logger.error('Error fetching dispute', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch dispute' });
  }
});

// Resolve dispute
router.post('/disputes/:id/resolve', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { resolutionNotes, resolutionAction, status } = req.body;

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: status || 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById: req.user.id,
        resolutionNotes,
        resolutionAction,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RESOLVE_DISPUTE',
        resource: 'DISPUTE',
        resourceId: id,
        details: { resolutionNotes, resolutionAction },
      },
    });

    res.json({ data: dispute });
  } catch (error) {
    logger.error('Error resolving dispute', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to resolve dispute' });
  }
});

// Get audit logs
router.get('/audit-log', requireRole(['ADMIN', 'PLATFORM_OPERATOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, entity, entityId, action, limit = 100 } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (entity) {
      where.resource = entity;
      if (entityId) {
        where.resourceId = entityId;
      }
    }
    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json({ data: logs });
  } catch (error) {
    logger.error('Error fetching audit logs', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

export { router as adminRouter };
