import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// PM Dashboard metrics
router.get('/dashboard/metrics', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get projects where user is PM
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
            role: 'PROJECT_MANAGER',
          },
        },
      },
      include: {
        contracts: {
          include: {
            milestones: true,
          },
        },
        escrowAgreement: {
          include: {
            transactions: true,
          },
        },
      },
    });

    const activeStatuses = ['DESIGN', 'READINESS', 'CONTRACT_NEGOTIATION', 'PERMIT_SUBMISSION', 'PERMITTED', 'CONSTRUCTION'];
    const activeProjects = projects.filter((p) => activeStatuses.includes(p.status));

    // Calculate upcoming milestones (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let upcomingMilestones = 0;
    projects.forEach((project) => {
      project.contracts.forEach((contract) => {
        contract.milestones.forEach((milestone) => {
          // Assuming milestones have a scheduledDate or similar field
          // For now, we'll use createdAt + typical duration estimate
        });
      });
    });

    const metrics = {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
      projectsAtRisk: projects.filter((p) => {
        // Simple risk calculation - projects with status issues or overdue
        // TODO: Implement more sophisticated risk calculation
        return false;
      }).length,
      upcomingMilestones,
      pendingApprovals: projects.reduce((count, p) => {
        // Count design versions pending approval
        return count; // TODO: Count pending approvals
      }, 0),
    };

    logger.info('PM metrics fetched', { userId: req.user.id, metrics });

    res.json({ data: metrics });
  } catch (error) {
    logger.error('Error fetching PM metrics', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Get PM's projects
router.get('/projects', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
            role: 'PROJECT_MANAGER',
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
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        contracts: {
          select: {
            id: true,
            status: true,
          },
        },
        designVersions: {
          select: {
            id: true,
            status: true,
            versionNumber: true,
          },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            contracts: true,
            designVersions: true,
            permitSets: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (error) {
    logger.error('Error fetching PM projects', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get PM alerts
router.get('/alerts', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
            role: 'PROJECT_MANAGER',
          },
        },
      },
      include: {
        designVersions: {
          where: {
            status: 'REVIEW_REQUIRED',
          },
        },
        readinessChecklist: {
          include: {
            items: {
              where: {
                status: 'PENDING_REVIEW',
              },
            },
          },
        },
      },
    });

    const alerts: any[] = [];

    projects.forEach((project) => {
      // Design approvals needed
      project.designVersions.forEach((version) => {
        alerts.push({
          type: 'APPROVAL_REQUEST',
          projectId: project.id,
          projectName: project.name,
          message: `Design version ${version.versionNumber} requires approval`,
          priority: 'HIGH',
          createdAt: new Date(),
        });
      });

      // Readiness items pending
      if (project.readinessChecklist) {
        project.readinessChecklist.items.forEach((item) => {
          alerts.push({
            type: 'REVIEW_REQUEST',
            projectId: project.id,
            projectName: project.name,
            message: `Readiness item "${item.title}" requires review`,
            priority: 'MEDIUM',
            createdAt: new Date(),
          });
        });
      }
    });

    res.json({ data: alerts });
  } catch (error) {
    logger.error('Error fetching PM alerts', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
});

// Get PM activity
router.get('/activity', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
            role: 'PROJECT_MANAGER',
          },
        },
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const activity = projects.map((project) => ({
      type: 'PROJECT_UPDATE',
      projectId: project.id,
      projectName: project.name,
      message: `Project "${project.name}" was updated`,
      timestamp: project.updatedAt,
    }));

    res.json({ data: activity });
  } catch (error) {
    logger.error('Error fetching PM activity', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
});

// Get team members
router.get('/team', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get all team members from PM's projects
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
            role: 'PROJECT_MANAGER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Aggregate unique users with their projects
    const teamMap = new Map();
    projects.forEach((project) => {
      project.members.forEach((membership) => {
        const userId = membership.user.id;
        if (!teamMap.has(userId)) {
          teamMap.set(userId, {
            ...membership.user,
            projects: [],
            workload: 0,
          });
        }
        teamMap.get(userId).projects.push({
          id: project.id,
          name: project.name,
          role: membership.role,
        });
        teamMap.get(userId).workload++;
      });
    });

    const team = Array.from(teamMap.values());

    res.json({ data: team });
  } catch (error) {
    logger.error('Error fetching PM team', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch team' });
  }
});

// Get schedule/milestones
router.get('/schedule', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
            role: 'PROJECT_MANAGER',
          },
        },
      },
      include: {
        contracts: {
          include: {
            milestones: true,
          },
        },
      },
    });

    const scheduleItems: any[] = [];

    projects.forEach((project) => {
      project.contracts.forEach((contract) => {
        contract.milestones.forEach((milestone) => {
          scheduleItems.push({
            id: milestone.id,
            projectId: project.id,
            projectName: project.name,
            type: 'MILESTONE',
            title: milestone.name,
            description: milestone.description,
            scheduledDate: milestone.completedAt || null, // Using completedAt as proxy
            status: milestone.status,
          });
        });
      });
    });

    res.json({ data: scheduleItems });
  } catch (error) {
    logger.error('Error fetching PM schedule', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch schedule' });
  }
});

// Report templates
router.get('/reports/templates', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    const templates = [
      {
        id: 'status',
        name: 'Project Status Report',
        description: 'Overview of all project statuses and progress',
      },
      {
        id: 'financial',
        name: 'Financial Summary',
        description: 'Budget, costs, and financial overview',
      },
      {
        id: 'progress',
        name: 'Progress Report',
        description: 'Detailed progress tracking and milestones',
      },
      {
        id: 'risk',
        name: 'Risk Assessment',
        description: 'Risk analysis and mitigation strategies',
      },
      {
        id: 'team',
        name: 'Team Performance',
        description: 'Team member workload and performance metrics',
      },
    ];

    res.json({ data: templates });
  } catch (error) {
    logger.error('Error fetching report templates', { error });
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Generate report
router.post('/reports/generate', requireRole(['PROJECT_MANAGER']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { templateId, projectIds, dateRange, metrics } = req.body;

    // TODO: Implement report generation logic
    const report = {
      id: `report-${Date.now()}`,
      templateId,
      projectIds,
      dateRange,
      generatedAt: new Date(),
      generatedBy: req.user.id,
      data: {}, // Report data would be generated here
    };

    res.json({ data: report });
  } catch (error) {
    logger.error('Error generating report', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

export { router as pmRouter };

