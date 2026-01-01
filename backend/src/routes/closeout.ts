import { Router } from 'express';
import { PrismaClient, CloseoutStatus, PunchListStatus } from '@prisma/client';
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
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Invalid file type', 'INVALID_FILE_TYPE'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

// Get or create closeout for project
router.get('/projects/:projectId/closeout', async (req: AuthRequest, res) => {
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

    let closeout = await prisma.projectCloseout.findUnique({
      where: { projectId },
      include: {
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        completedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!closeout) {
      closeout = await prisma.projectCloseout.create({
        data: {
          projectId,
          status: CloseoutStatus.IN_PROGRESS,
        },
        include: {
          documents: true,
        },
      });
    }

    res.json({ data: closeout });
  } catch (error) {
    logger.error('Error fetching closeout', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch closeout' });
  }
});

// Update closeout checklist
router.patch('/closeout/:closeoutId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { closeoutId } = req.params;
    const updateData: any = { ...req.body };

    // Auto-update status based on checklist
    const allComplete =
      updateData.punchListComplete &&
      updateData.finalInspectionPassed &&
      updateData.finalPaymentReleased &&
      updateData.warrantyProvided &&
      updateData.asBuiltDrawingsProvided &&
      updateData.liensReleased;

    if (allComplete) {
      updateData.status = CloseoutStatus.READY_FOR_COMPLETION;
    } else {
      // Check if any items are incomplete
      const incompleteCount = [
        updateData.punchListComplete,
        updateData.finalInspectionPassed,
        updateData.finalPaymentReleased,
        updateData.warrantyProvided,
        updateData.asBuiltDrawingsProvided,
        updateData.liensReleased,
      ].filter((v) => v === false).length;

      if (incompleteCount > 0) {
        updateData.status = CloseoutStatus.PENDING_ITEMS;
      }
    }

    const closeout = await prisma.projectCloseout.update({
      where: { id: closeoutId },
      data: updateData,
    });

    logger.info('Closeout updated', {
      closeoutId,
      status: closeout.status,
      userId: req.user.id,
    });

    res.json({ data: closeout });
  } catch (error) {
    logger.error('Error updating closeout', { error, closeoutId: req.params.closeoutId });
    res.status(500).json({ message: 'Failed to update closeout' });
  }
});

// Complete closeout
router.post('/closeout/:closeoutId/complete', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { closeoutId } = req.params;

    const closeout = await prisma.projectCloseout.findUnique({
      where: { id: closeoutId },
      include: {
        project: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!closeout) {
      return res.status(404).json({ message: 'Closeout not found' });
    }

    // Verify authorization
    if (closeout.project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (closeout.status !== CloseoutStatus.READY_FOR_COMPLETION) {
      return res.status(400).json({
        message: 'Closeout not ready for completion',
        currentStatus: closeout.status,
      });
    }

    const updated = await prisma.projectCloseout.update({
      where: { id: closeoutId },
      data: {
        status: CloseoutStatus.COMPLETED,
        completedAt: new Date(),
        completedById: req.user.id,
      },
      include: {
        completedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: updated.projectId },
      data: {
        status: 'COMPLETED',
      },
    });

    logger.info('Closeout completed', {
      closeoutId,
      projectId: updated.projectId,
      userId: req.user.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error completing closeout', { error, closeoutId: req.params.closeoutId });
    res.status(500).json({ message: 'Failed to complete closeout' });
  }
});

// Upload closeout document
router.post(
  '/closeout/:closeoutId/documents',
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { closeoutId } = req.params;
      const { documentType, description } = req.body;

      // Verify closeout access
      const closeout = await prisma.projectCloseout.findUnique({
        where: { id: closeoutId },
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

      if (!closeout) {
        return res.status(404).json({ message: 'Closeout not found' });
      }

      const hasAccess =
        closeout.project.ownerId === req.user.id ||
        closeout.project.members.length > 0 ||
        req.user.role === 'ADMIN';

      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Upload file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = req.file.originalname.split('.').pop();
      const key = `closeout/${closeoutId}/${timestamp}-${random}.${extension}`;

      const fileUrl = await storage.upload(req.file.buffer, key, req.file.mimetype);

      const document = await prisma.closeoutDocument.create({
        data: {
          closeoutId,
          documentType: documentType || 'OTHER',
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          fileUrl,
          description: description || undefined,
          uploadedById: req.user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      logger.info('Closeout document uploaded', {
        documentId: document.id,
        closeoutId,
        userId: req.user.id,
      });

      res.status(201).json({ data: document });
    } catch (error) {
      logger.error('Error uploading closeout document', {
        error,
        closeoutId: req.params.closeoutId,
      });
      res.status(500).json({ message: 'Failed to upload document' });
    }
  }
);

// Get punch list items
router.get('/projects/:projectId/punch-list', async (req: AuthRequest, res) => {
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

    const items = await prisma.punchListItem.findMany({
      where: { projectId },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        images: {
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ data: items });
  } catch (error) {
    logger.error('Error fetching punch list', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch punch list' });
  }
});

// Create punch list item
router.post('/projects/:projectId/punch-list', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const { title, description, location, priority, assignedToId } = req.body;

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

    const item = await prisma.punchListItem.create({
      data: {
        projectId,
        title,
        description,
        location: location || undefined,
        priority: priority || 'MEDIUM',
        assignedToId: assignedToId || undefined,
        reportedById: req.user.id,
        status: PunchListStatus.OPEN,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Punch list item created', {
      itemId: item.id,
      projectId,
      userId: req.user.id,
    });

    res.status(201).json({ data: item });
  } catch (error) {
    logger.error('Error creating punch item', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to create punch item' });
  }
});

// Update punch list item
router.patch('/punch-list/:itemId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { itemId } = req.params;
    const { status, resolutionNotes, assignedToId, priority } = req.body;

    const updateData: any = {};

    if (status) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (priority) updateData.priority = priority;

    if (status === PunchListStatus.RESOLVED || status === PunchListStatus.VERIFIED) {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = req.user.id;
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }
    }

    const item = await prisma.punchListItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Punch list item updated', {
      itemId,
      status: item.status,
      userId: req.user.id,
    });

    res.json({ data: item });
  } catch (error) {
    logger.error('Error updating punch item', { error, itemId: req.params.itemId });
    res.status(500).json({ message: 'Failed to update punch item' });
  }
});

// Upload punch list image
router.post(
  '/punch-list/:itemId/images',
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { itemId } = req.params;
      const { description } = req.body;

      // Verify item access
      const item = await prisma.punchListItem.findUnique({
        where: { id: itemId },
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

      if (!item) {
        return res.status(404).json({ message: 'Punch item not found' });
      }

      const hasAccess =
        item.project.ownerId === req.user.id ||
        item.project.members.length > 0 ||
        req.user.role === 'ADMIN';

      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Upload file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = req.file.originalname.split('.').pop();
      const key = `punch-list/${itemId}/${timestamp}-${random}.${extension}`;

      const fileUrl = await storage.upload(req.file.buffer, key, req.file.mimetype);

      const image = await prisma.punchListImage.create({
        data: {
          punchItemId: itemId,
          fileName: req.file.originalname,
          fileUrl,
          description: description || undefined,
          uploadedById: req.user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      logger.info('Punch list image uploaded', {
        imageId: image.id,
        itemId,
        userId: req.user.id,
      });

      res.status(201).json({ data: image });
    } catch (error) {
      logger.error('Error uploading punch list image', { error, itemId: req.params.itemId });
      res.status(500).json({ message: 'Failed to upload image' });
    }
  }
);

export { router as closeoutRouter };

