import { Router } from 'express';
import { PrismaClient, ReviewStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { enforceReviewSubmissionRules } from '../middleware/workflowRules.js';
import { logAuditEvent } from '../services/auditLogger.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// Check if user can submit review (CRITICAL: enforce locking)
router.get('/projects/:projectId/can-review', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        closeout: true,
        escrowAgreement: {
          include: {
            transactions: {
              where: {
                transactionType: 'RELEASE',
                status: 'COMPLETED',
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

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const canReview = {
      allowed: false,
      reasons: [] as string[],
    };

    // RULE 1: Project must be completed
    if (project.status !== 'COMPLETED') {
      canReview.reasons.push('Project must be completed');
    }

    // RULE 2: Closeout must be completed
    if (!project.closeout || project.closeout.status !== 'COMPLETED') {
      canReview.reasons.push('Project closeout must be completed');
    }

    // RULE 3: Final payment must be released
    if (!project.closeout?.finalPaymentReleased) {
      canReview.reasons.push('Final payment must be released');
    }

    canReview.allowed = canReview.reasons.length === 0;

    res.json({ data: canReview });
  } catch (error) {
    logger.error('Error checking review eligibility', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to check eligibility' });
  }
});

// Get reviews for project
router.get('/projects/:projectId/reviews', async (req: AuthRequest, res) => {
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

    const reviews = await prisma.projectReview.findMany({
      where: { projectId },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewSubject: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        response: {
          include: {
            respondedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: reviews });
  } catch (error) {
    logger.error('Error fetching reviews', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Submit review (with locking enforcement)
router.post('/projects/:projectId/reviews', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    const {
      reviewSubjectId,
      subjectRole,
      qualityRating,
      timelinessRating,
      communicationRating,
      professionalismRating,
      valueRating,
      title,
      reviewText,
      pros,
      cons,
      wouldRecommend,
      wouldHireAgain,
    } = req.body;

    // ENFORCE WORKFLOW RULES
    try {
      await enforceReviewSubmissionRules(projectId);
    } catch (error: any) {
      return res.status(403).json({
        message: 'Review submission blocked',
        error: error.message,
      });
    }

    // Calculate overall rating
    const ratings = [
      qualityRating,
      timelinessRating,
      communicationRating,
      professionalismRating,
      valueRating,
    ].filter((r) => r !== null && r !== undefined && r > 0) as number[];

    const overallRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : null;

    const review = await prisma.projectReview.create({
      data: {
        projectId,
        reviewerId: req.user.id,
        reviewSubjectId,
        subjectRole: subjectRole || 'CONTRACTOR',
        qualityRating: qualityRating || undefined,
        timelinessRating: timelinessRating || undefined,
        communicationRating: communicationRating || undefined,
        professionalismRating: professionalismRating || undefined,
        valueRating: valueRating || undefined,
        overallRating: overallRating ? parseFloat(overallRating.toFixed(2)) : undefined,
        title: title || undefined,
        reviewText: reviewText || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
        wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : undefined,
        wouldHireAgain: wouldHireAgain !== undefined ? wouldHireAgain : undefined,
        status: ReviewStatus.SUBMITTED,
        publishedAt: new Date(),
        visible: true,
      },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        reviewSubject: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    logger.info('Review submitted', {
      reviewId: review.id,
      projectId,
      reviewerId: req.user.id,
      reviewSubjectId,
    });

    res.status(201).json({ data: review });
  } catch (error) {
    logger.error('Error submitting review', { error, projectId: req.params.projectId });
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

// Respond to review
router.post('/reviews/:reviewId/response', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { reviewId } = req.params;
    const { responseText } = req.body;

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ message: 'Response text is required' });
    }

    // Verify review exists and user is the subject
    const review = await prisma.projectReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewSubjectId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized - can only respond to reviews about you' });
    }

    // Check if response already exists
    const existingResponse = await prisma.reviewResponse.findUnique({
      where: { reviewId },
    });

    if (existingResponse) {
      return res.status(400).json({ message: 'Response already exists' });
    }

    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        responseText: responseText.trim(),
        respondedById: req.user.id,
      },
      include: {
        respondedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Review response submitted', {
      responseId: response.id,
      reviewId,
      userId: req.user.id,
    });

    res.status(201).json({ data: response });
  } catch (error) {
    logger.error('Error submitting response', { error, reviewId: req.params.reviewId });
    res.status(500).json({ message: 'Failed to submit response' });
  }
});

export { router as reviewsRouter };

