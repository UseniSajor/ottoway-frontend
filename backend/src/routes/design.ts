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
    fileSize: 50 * 1024 * 1024, // 50MB
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
      'application/acad',
      'application/x-dwg',
      'image/vnd.dwg',
    ];

    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|dwg|dxf|jpg|jpeg|png|rvt)$/i)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only PDF, DWG, DXF, JPG, PNG, and RVT files allowed', 'INVALID_FILE_TYPE'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

// GET /api/projects/:projectId/design-versions - Get all design versions for a project
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

    const versions = await prisma.designVersion.findMany({
      where: { projectId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
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
      orderBy: { versionNumber: 'desc' },
    });

    res.json({ data: versions });
  } catch (error) {
    logger.error('Error fetching design versions', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch design versions' });
  }
});

// POST /api/projects/:projectId/design-versions - Create new design version
router.post('/projects/:projectId/design-versions', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const { versionName, description } = req.body;

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

    // Get latest version number
    const latestVersion = await prisma.designVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const versionNumber = (latestVersion?.versionNumber || 0) + 1;

    const designVersion = await prisma.designVersion.create({
      data: {
        projectId,
        versionNumber,
        versionName: versionName || `Version ${versionNumber}`,
        description,
        uploadedById: req.user.id,
        status: DesignStatus.DRAFT,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        documents: true,
        comments: true,
      },
    });

    logger.info('Design version created', {
      designVersionId: designVersion.id,
      projectId,
      versionNumber,
      userId: req.user.id,
    });

    res.status(201).json({ data: designVersion });
  } catch (error) {
    logger.error('Error creating design version', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to create design version' });
  }
});

// POST /api/design-versions/:versionId/documents - Upload document to design version
router.post(
  '/design-versions/:versionId/documents',
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { versionId } = req.params;
      const { documentType, description } = req.body;

      // Verify version access
      const designVersion = await prisma.designVersion.findUnique({
        where: { id: versionId },
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

      const hasAccess =
        designVersion.project.ownerId === req.user.id ||
        designVersion.project.members.length > 0 ||
        req.user.role === 'ADMIN';

      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Upload file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = req.file.originalname.split('.').pop();
      const key = `design/${versionId}/${timestamp}-${random}.${extension}`;

      const fileUrl = await storage.upload(req.file.buffer, key, req.file.mimetype);

      const document = await prisma.designDocument.create({
        data: {
          designVersionId: versionId,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          fileUrl,
          documentType: documentType || 'OTHER',
          description: description || undefined,
          uploadedById: req.user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      logger.info('Design document uploaded', {
        documentId: document.id,
        designVersionId: versionId,
        userId: req.user.id,
      });

      res.status(201).json({ data: document });
    } catch (error) {
      logger.error('Error uploading document', { error, versionId: req.params.versionId });
      res.status(500).json({ message: 'Failed to upload document' });
    }
  }
);

// PATCH /api/design-versions/:versionId/status - Update design version status
router.patch('/design-versions/:versionId/status', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { versionId } = req.params;
    const { status, approvalNotes } = req.body;

    if (!status || !Object.values(DesignStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify version access
    const designVersion = await prisma.designVersion.findUnique({
      where: { id: versionId },
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

    // Check permissions for status changes
    const canApprove =
      designVersion.project.ownerId === req.user.id ||
      designVersion.project.members.some((m) => m.role === 'PROJECT_MANAGER') ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'PROJECT_MANAGER';

    const updateData: any = { status };

    // If approving for permit, record approval
    if (status === DesignStatus.APPROVED_FOR_PERMIT) {
      if (!canApprove) {
        return res.status(403).json({ message: 'Unauthorized to approve' });
      }

      updateData.approvedById = req.user.id;
      updateData.approvedAt = new Date();
      updateData.approvalNotes = approvalNotes || undefined;

      // Mark previous versions as superseded
      await prisma.designVersion.updateMany({
        where: {
          projectId: designVersion.projectId,
          versionNumber: { lt: designVersion.versionNumber },
          status: { not: DesignStatus.SUPERSEDED },
        },
        data: { status: DesignStatus.SUPERSEDED },
      });
    }

    const updated = await prisma.designVersion.update({
      where: { id: versionId },
      data: updateData,
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    logger.info('Design version status updated', {
      designVersionId: updated.id,
      status,
      userId: req.user.id,
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Error updating design status', { error, versionId: req.params.versionId });
    res.status(500).json({ message: 'Failed to update design status' });
  }
});

// POST /api/design-versions/:versionId/comments - Add comment to design version
router.post('/design-versions/:versionId/comments', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { versionId } = req.params;
    const { comment, commentType } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    // Verify version access
    const designVersion = await prisma.designVersion.findUnique({
      where: { id: versionId },
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

    const hasAccess =
      designVersion.project.ownerId === req.user.id ||
      designVersion.project.members.length > 0 ||
      req.user.role === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const designComment = await prisma.designComment.create({
      data: {
        designVersionId: versionId,
        userId: req.user.id,
        comment: comment.trim(),
        commentType: commentType || 'FEEDBACK',
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Design comment added', {
      commentId: designComment.id,
      designVersionId: versionId,
      userId: req.user.id,
    });

    res.status(201).json({ data: designComment });
  } catch (error) {
    logger.error('Error adding comment', { error, versionId: req.params.versionId });
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// DELETE /api/design-documents/:documentId - Delete design document
router.delete('/design-documents/:documentId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { documentId } = req.params;

    const document = await prisma.designDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only uploader or admin can delete
    if (document.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.designDocument.delete({
      where: { id: documentId },
    });

    // TODO: Delete actual file from storage

    logger.info('Design document deleted', {
      documentId,
      userId: req.user.id,
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting document', { error, documentId: req.params.documentId });
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export { router as designRouter };

