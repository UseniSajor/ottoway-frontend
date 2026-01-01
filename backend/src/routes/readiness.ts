import { Router } from 'express';
import { PrismaClient, ReadinessItemStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { getProjectTypeMetadata } from '../data/projectTypeMetadata';
import multer from 'multer';
import { storage } from '../services/storage';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
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

// Get or create readiness checklist for project
router.get('/projects/:projectId/readiness', async (req: AuthRequest, res) => {
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

    // Get or create checklist
    let checklist = await prisma.readinessChecklist.findUnique({
      where: { projectId },
      include: {
        items: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            completedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            documents: {
              include: {
                uploadedBy: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            comments: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: { documents: true, comments: true },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // If checklist doesn't exist, create from project type
    if (!checklist && project.projectType) {
      const metadata = getProjectTypeMetadata(project.projectType);
      
      if (metadata && metadata.readinessChecklist) {
        // Create checklist
        checklist = await prisma.readinessChecklist.create({
          data: {
            projectId,
            generatedFromType: true,
            items: {
              create: metadata.readinessChecklist.map((itemTitle, index) => ({
                title: itemTitle,
                description: undefined,
                category: categorizeItem(itemTitle),
                required: true,
                orderIndex: index,
                status: ReadinessItemStatus.NOT_STARTED,
              })),
            },
          },
          include: {
            items: {
              include: {
                assignedTo: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                completedBy: {
                  select: { id: true, firstName: true, lastName: true },
                },
                documents: true,
                comments: true,
                _count: {
                  select: { documents: true, comments: true },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        });

        logger.info('Readiness checklist created from project type', {
          projectId,
          projectType: project.projectType,
          itemCount: metadata.readinessChecklist.length,
        });
      }
    }

    if (!checklist) {
      return res.status(404).json({ message: 'Readiness checklist not found and could not be generated' });
    }

    res.json({ data: checklist });
  } catch (error) {
    logger.error('Error fetching readiness checklist', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch readiness checklist' });
  }
});

// Update readiness item status
router.patch('/readiness-items/:itemId/status', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { itemId } = req.params;
    const { status, completionNotes } = req.body;

    if (!status || !Object.values(ReadinessItemStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData: any = { status };

    if (status === ReadinessItemStatus.COMPLETED) {
      updateData.completedById = req.user.id;
      updateData.completedAt = new Date();
      updateData.completionNotes = completionNotes || undefined;
    } else if (status === ReadinessItemStatus.IN_PROGRESS) {
      // Clear completion data if moving back from completed
      updateData.completedById = null;
      updateData.completedAt = null;
      updateData.completionNotes = null;
    }

    const item = await prisma.readinessItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        completedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        checklist: {
          select: { projectId: true },
        },
      },
    });

    logger.info('Readiness item status updated', {
      itemId,
      status,
      userId: req.user.id,
    });

    res.json({ data: item });
  } catch (error) {
    logger.error('Error updating readiness item status', { error, itemId: req.params.itemId });
    res.status(500).json({ message: 'Failed to update readiness item status' });
  }
});

// Assign readiness item to user
router.patch('/readiness-items/:itemId/assign', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { itemId } = req.params;
    const { assignedToId } = req.body;

    const item = await prisma.readinessItem.update({
      where: { id: itemId },
      data: {
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    logger.info('Readiness item assigned', {
      itemId,
      assignedToId,
      userId: req.user.id,
    });

    res.json({ data: item });
  } catch (error) {
    logger.error('Error assigning readiness item', { error, itemId: req.params.itemId });
    res.status(500).json({ message: 'Failed to assign readiness item' });
  }
});

// Upload document to readiness item
router.post(
  '/readiness-items/:itemId/documents',
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
      const item = await prisma.readinessItem.findUnique({
        where: { id: itemId },
        include: {
          checklist: {
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

      if (!item) {
        return res.status(404).json({ message: 'Readiness item not found' });
      }

      const hasAccess =
        item.checklist.project.ownerId === req.user.id ||
        item.checklist.project.members.length > 0 ||
        req.user.role === 'ADMIN';

      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Upload file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = req.file.originalname.split('.').pop();
      const key = `readiness/${itemId}/${timestamp}-${random}.${extension}`;

      const fileUrl = await storage.upload(req.file.buffer, key, req.file.mimetype);

      const document = await prisma.readinessDocument.create({
        data: {
          readinessItemId: itemId,
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

      logger.info('Readiness document uploaded', {
        documentId: document.id,
        itemId,
        userId: req.user.id,
      });

      res.status(201).json({ data: document });
    } catch (error) {
      logger.error('Error uploading readiness document', { error, itemId: req.params.itemId });
      res.status(500).json({ message: 'Failed to upload document' });
    }
  }
);

// Add comment to readiness item
router.post('/readiness-items/:itemId/comments', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { itemId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    // Verify item access
    const item = await prisma.readinessItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
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

    if (!item) {
      return res.status(404).json({ message: 'Readiness item not found' });
    }

    const hasAccess =
      item.checklist.project.ownerId === req.user.id ||
      item.checklist.project.members.length > 0 ||
      req.user.role === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const readinessComment = await prisma.readinessComment.create({
      data: {
        readinessItemId: itemId,
        userId: req.user.id,
        comment: comment.trim(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Readiness comment added', {
      commentId: readinessComment.id,
      itemId,
      userId: req.user.id,
    });

    res.status(201).json({ data: readinessComment });
  } catch (error) {
    logger.error('Error adding readiness comment', { error, itemId: req.params.itemId });
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Delete readiness document
router.delete('/readiness-documents/:documentId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { documentId } = req.params;

    const document = await prisma.readinessDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only uploader or admin can delete
    if (document.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.readinessDocument.delete({
      where: { id: documentId },
    });

    // TODO: Delete actual file from storage

    logger.info('Readiness document deleted', {
      documentId,
      userId: req.user.id,
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting readiness document', { error, documentId: req.params.documentId });
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

// Helper function to categorize readiness items
function categorizeItem(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('plan') || lowerTitle.includes('drawing') || lowerTitle.includes('design')) {
    return 'DESIGN';
  }
  if (lowerTitle.includes('permit') || lowerTitle.includes('approval') || lowerTitle.includes('zoning')) {
    return 'PERMITS';
  }
  if (lowerTitle.includes('site') || lowerTitle.includes('survey') || lowerTitle.includes('geotechnical')) {
    return 'SITE';
  }
  if (lowerTitle.includes('utility') || lowerTitle.includes('connection')) {
    return 'UTILITIES';
  }
  if (lowerTitle.includes('approval') || lowerTitle.includes('clearance')) {
    return 'APPROVALS';
  }
  return 'OTHER';
}

export { router as readinessRouter };
