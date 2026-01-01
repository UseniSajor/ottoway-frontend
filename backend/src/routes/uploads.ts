import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { storage } from '../services/storage';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

// POST /api/uploads
router.post(
  '/',
  upload.single('file'),
  validate([
    { field: 'category', required: true, type: 'enum', enumValues: ['receipt', 'contract', 'design', 'permit', 'other'] },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded', 'MISSING_FILE');
      }

      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { category } = req.body;
      const file = req.file;

      // Generate unique key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = file.originalname.split('.').pop();
      const key = `${category}/${req.user.id}/${timestamp}-${random}.${extension}`;

      // Upload to storage
      const url = await storage.upload(file.buffer, key, file.mimetype);

      logger.info('File uploaded', {
        userId: req.user.id,
        category,
        key,
        size: file.size,
      });

      res.status(201).json({
        data: {
          url,
          key,
          size: file.size,
          contentType: file.mimetype,
          originalName: file.originalname,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('File upload error', error);
      throw new AppError(500, 'File upload failed', 'UPLOAD_ERROR');
    }
  }
);

// DELETE /api/uploads/:key
router.delete('/:key', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const { key } = req.params;

    // TODO: Verify user owns the file before deleting
    await storage.delete(key);

    logger.info('File deleted', { userId: req.user.id, key });

    res.json({ message: 'File deleted' });
  } catch (error: any) {
    logger.error('File delete error', error);
    throw new AppError(500, 'File delete failed', 'DELETE_ERROR');
  }
});

export { router as uploadsRouter };



