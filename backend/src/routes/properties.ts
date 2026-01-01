import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// GET /api/properties - List user's properties
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: properties });
  } catch (error) {
    logger.error('Error fetching properties', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
});

// POST /api/properties - Create property
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      propertyType,
      streetAddress,
      city,
      state,
      zipCode,
      county,
      squareFootage,
      unitCount,
      yearBuilt,
      buildingClass,
      occupancy,
      leaseType,
    } = req.body;

    // Validate required fields
    if (!propertyType || !streetAddress || !city || !state || !zipCode) {
      return res.status(400).json({ 
        message: 'Missing required fields: propertyType, streetAddress, city, state, zipCode' 
      });
    }

    const property = await prisma.property.create({
      data: {
        ownerId: req.user.id,
        propertyType,
        streetAddress,
        city,
        state,
        zipCode,
        county,
        squareFootage,
        unitCount,
        yearBuilt,
        buildingClass,
        occupancy,
        leaseType,
      },
    });

    logger.info('Property created', { propertyId: property.id, ownerId: req.user.id });
    res.status(201).json({ data: property });
  } catch (error) {
    logger.error('Error creating property', { error, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to create property' });
  }
});

// GET /api/properties/:id - Get property details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        projects: {
          include: {
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                role: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Verify ownership
    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({ data: property });
  } catch (error) {
    logger.error('Error fetching property', { error, propertyId: req.params.id });
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

// PUT /api/properties/:id - Update property
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const existing = await prisma.property.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: req.body,
    });

    logger.info('Property updated', { propertyId: property.id });
    res.json({ data: property });
  } catch (error) {
    logger.error('Error updating property', { error, propertyId: req.params.id });
    res.status(500).json({ message: 'Failed to update property' });
  }
});

// DELETE /api/properties/:id - Delete property
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const existing = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { 
        _count: { 
          select: { projects: true } 
        } 
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (existing._count.projects > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete property with associated projects' 
      });
    }

    await prisma.property.delete({
      where: { id: req.params.id },
    });

    logger.info('Property deleted', { propertyId: req.params.id });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting property', { error, propertyId: req.params.id });
    res.status(500).json({ message: 'Failed to delete property' });
  }
});

// GET /api/properties/:id/projects - Get projects for property
router.get('/:id/projects', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: { propertyId: req.params.id },
      include: {
        owner: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: projects });
  } catch (error) {
    logger.error('Error fetching property projects', { error, propertyId: req.params.id });
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

export { router as propertiesRouter };



