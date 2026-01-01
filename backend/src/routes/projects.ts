import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ProjectService } from '../services/projectService';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// GET /api/projects
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: {
        // TODO: Filter by user's access (project members)
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to get projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await ProjectService.getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ data: project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Failed to get project' });
  }
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      propertyId,
      name,
      description,
      category,
      projectType,
      complexity,
      squareFootage,
      unitCount,
      jurisdictionCity,
      jurisdictionState,
      jurisdictionCounty,
    } = req.body;

    if (!projectType) {
      return res.status(400).json({ message: 'project_type is required' });
    }

    const project = await ProjectService.createProject({
      propertyId: propertyId || undefined,
      name,
      description,
      category,
      projectType,
      complexity,
      squareFootage,
      unitCount,
      jurisdictionCity,
      jurisdictionState,
      jurisdictionCounty,
      createdBy: req.user.id,
      ownerId: req.user.id, // Set ownerId from authenticated user
    });

    res.status(201).json({ data: project });
  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.message === 'project_type is required') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// POST /api/projects/classify-type (must be before /:id routes)
router.post('/classify-type', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // TODO: Implement ML-based project type classification
    const { ProjectType } = await import('@prisma/client');
    res.json({
      data: {
        projectType: ProjectType.NEW_CONSTRUCTION_RESIDENTIAL,
        confidence: 0.85,
      },
    });
  } catch (error) {
    console.error('Classify type error:', error);
    res.status(500).json({ message: 'Failed to classify project type' });
  }
});

// POST /api/projects/assess-complexity (must be before /:id routes)
router.post('/assess-complexity', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // TODO: Implement ML-based complexity assessment
    const { ProjectComplexity } = await import('@prisma/client');
    res.json({
      data: {
        complexity: ProjectComplexity.MODERATE,
        confidence: 0.75,
      },
    });
  } catch (error) {
    console.error('Assess complexity error:', error);
    res.status(500).json({ message: 'Failed to assess complexity' });
  }
});

// GET /api/projects/:id/events
router.get('/:id/events', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const events = await prisma.projectEvent.findMany({
      where: {
        projectId: req.params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent 100 events
    });

    res.json({ data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to get events' });
  }
});

// GET /api/projects/:id/recommendations
router.get('/:id/recommendations', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recommendations = await prisma.recommendation.findMany({
      where: {
        projectId: req.params.id,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

// GET /api/projects/:id/scores
router.get('/:id/scores', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const scores = await prisma.modelScore.findMany({
      where: {
        projectId: req.params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: scores });
  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({ message: 'Failed to get scores' });
  }
});

export { router as projectsRouter };

