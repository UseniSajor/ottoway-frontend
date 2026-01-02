import { Router } from 'express';
import { PrismaClient, DesignStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import multer from 'multer';
import { storage } from '../services/storage';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for design files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `File type ${file.mimetype} not allowed`, 'INVALID_FILE_TYPE'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

// GET /api/projects/:id/design-versions - Get all design versions for a project
router.get('/projects/:projectId/design-versions', async (req: AuthRequest, res) => {
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

    const designVersions = await prisma.designVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ data: designVersions });
  } catch (error) {
    logger.error('Error fetching design versions', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch design versions' });
  }
});

// POST /api/projects/:id/design-versions - Upload new design version
router.post(
  '/projects/:projectId/design-versions',
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { projectId } = req.params;
      const { status, description } = req.body;

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

      // Get next version number
      const latestVersion = await prisma.designVersion.findFirst({
        where: { projectId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      // Upload file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = req.file.originalname.split('.').pop();
      const key = `design/${projectId}/${timestamp}-${random}.${extension}`;

      const fileUrl = await storage.upload(req.file.buffer, key, req.file.mimetype);

      // Create design version
      const designVersion = await prisma.designVersion.create({
        data: {
          projectId,
          version: nextVersion,
          status: (status as DesignStatus) || DesignStatus.DRAFT,
          fileUrl,
        },
      });

      logger.info('Design version created', {
        designVersionId: designVersion.id,
        projectId,
        version: nextVersion,
        userId: req.user.id,
      });

      res.status(201).json({ data: designVersion });
    } catch (error) {
      logger.error('Error creating design version', { error, projectId: req.params.projectId });
      res.status(500).json({ message: 'Failed to create design version' });
    }
  }
);

// GET /api/design-versions/:id - Get design version details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const designVersion = await prisma.designVersion.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            members: {
              where: { userId: req.user.id },
            },
          },
        },
      },
    });

    if (!designVersion) {
      return res.status(404).json({ message: 'Design version not found' });
    }

    // Verify access
    const hasAccess =
      designVersion.project.ownerId === req.user.id ||
      designVersion.project.members.length > 0 ||
      req.user.role === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({ data: designVersion });
  } catch (error) {
    logger.error('Error fetching design version', { error, designVersionId: req.params.id });
    res.status(500).json({ message: 'Failed to fetch design version' });
  }
});

// PUT /api/design-versions/:id/status - Update design version status
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { status } = req.body;

    if (!status || !Object.values(DesignStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const designVersion = await prisma.designVersion.findUnique({
      where: { id: req.params.id },
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
    });

    if (!designVersion) {
      return res.status(404).json({ message: 'Design version not found' });
    }

    // Verify access - only owner, PM, or ADMIN can change status
    const hasAccess =
      designVersion.project.ownerId === req.user.id ||
      designVersion.project.members.some((m) => m.role === 'PROJECT_MANAGER') ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'PROJECT_MANAGER';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to update status' });
    }

    const updated = await prisma.designVersion.update({
      where: { id: req.params.id },
      data: { status: status as DesignStatus },
    });

    logger.info('Design version status updated', {
      designVersionId: updated.id,
      status,
      userId: req.user.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error updating design version status', { error, designVersionId: req.params.id });
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// POST /api/design-versions/:id/approve - Approve design for permit
router.post('/:id/approve', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const designVersion = await prisma.designVersion.findUnique({
      where: { id: req.params.id },
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
    });

    if (!designVersion) {
      return res.status(404).json({ message: 'Design version not found' });
    }

    // Only owner, PM, or ADMIN can approve
    const canApprove =
      designVersion.project.ownerId === req.user.id ||
      designVersion.project.members.some((m) => m.role === 'PROJECT_MANAGER') ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'PROJECT_MANAGER';

    if (!canApprove) {
      return res.status(403).json({ message: 'Unauthorized to approve' });
    }

    const updated = await prisma.designVersion.update({
      where: { id: req.params.id },
      data: { status: DesignStatus.APPROVED_FOR_PERMIT },
    });

    logger.info('Design version approved for permit', {
      designVersionId: updated.id,
      userId: req.user.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error approving design version', { error, designVersionId: req.params.id });
    res.status(500).json({ message: 'Failed to approve design version' });
  }
});

// GET /api/design-versions/:id/download - Get download URL for design file
router.get('/:id/download', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const designVersion = await prisma.designVersion.findUnique({
      where: { id: req.params.id },
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
    });

    if (!designVersion) {
      return res.status(404).json({ message: 'Design version not found' });
    }

    if (!designVersion.fileUrl) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Verify access
    const hasAccess =
      designVersion.project.ownerId === req.user.id ||
      designVersion.project.members.length > 0 ||
      req.user.role === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Return download URL (or generate signed URL if using S3)
    res.json({
      data: {
        downloadUrl: designVersion.fileUrl,
        fileName: `design-v${designVersion.version}.pdf`,
      },
    });
  } catch (error) {
    logger.error('Error getting download URL', { error, designVersionId: req.params.id });
    res.status(500).json({ message: 'Failed to get download URL' });
  }
});

export { router as designVersionsRouter };


