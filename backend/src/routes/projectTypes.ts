import { Router } from 'express';
import { 
  getProjectTypeMetadata, 
  getAllProjectTypes, 
  getProjectTypesByCategory 
} from '../data/projectTypeMetadata.js';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/project-types - Get all project types
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    if (category) {
      const types = getProjectTypesByCategory(category as string);
      return res.json({ data: types });
    }
    
    const types = getAllProjectTypes();
    res.json({ data: types });
  } catch (error) {
    logger.error('Error fetching project types', { error });
    res.status(500).json({ message: 'Failed to fetch project types' });
  }
});

// GET /api/project-types/:type - Get metadata for specific type
router.get('/:type', async (req, res) => {
  try {
    const metadata = getProjectTypeMetadata(req.params.type);
    
    if (!metadata) {
      return res.status(404).json({ message: 'Project type not found' });
    }
    
    res.json({ data: { type: req.params.type, ...metadata } });
  } catch (error) {
    logger.error('Error fetching project type', { error, type: req.params.type });
    res.status(500).json({ message: 'Failed to fetch project type' });
  }
});

// POST /api/project-types/assess-complexity - Assess project complexity (rules-based)
router.post('/assess-complexity', async (req, res) => {
  try {
    const { projectType, squareFootage, unitCount, customFactors } = req.body;
    
    const metadata = getProjectTypeMetadata(projectType);
    if (!metadata) {
      return res.status(400).json({ message: 'Invalid project type' });
    }
    
    let complexity = metadata.typicalComplexity;
    let reasoning: string[] = [`Base complexity for ${metadata.name}: ${complexity}`];
    let confidence = 0.85;
    
    // Size-based adjustments
    if (squareFootage) {
      if (squareFootage > 10000 && complexity !== 'MAJOR') {
        complexity = 'MAJOR';
        reasoning.push('Very large square footage (>10,000 sqft) increases to MAJOR');
        confidence = 0.95;
      } else if (squareFootage > 5000 && complexity === 'MODERATE') {
        complexity = 'COMPLEX';
        reasoning.push('Large square footage (>5,000 sqft) increases to COMPLEX');
      } else if (squareFootage < 1000 && complexity === 'MODERATE') {
        complexity = 'SIMPLE';
        reasoning.push('Small square footage (<1,000 sqft) reduces to SIMPLE');
      }
    }
    
    // Multi-unit adjustments
    if (unitCount) {
      if (unitCount > 10) {
        complexity = 'MAJOR';
        reasoning.push('Large multi-unit project (>10 units) increases to MAJOR');
        confidence = 0.95;
      } else if (unitCount > 4 && complexity !== 'MAJOR') {
        complexity = 'COMPLEX';
        reasoning.push('Multi-unit project (>4 units) increases to COMPLEX');
      }
    }
    
    // Custom factors
    if (customFactors) {
      if (customFactors.historicBuilding) {
        if (complexity === 'SIMPLE') complexity = 'MODERATE';
        else if (complexity === 'MODERATE') complexity = 'COMPLEX';
        reasoning.push('Historic building adds complexity');
      }
      
      if (customFactors.seismicUpgrade) {
        if (complexity !== 'MAJOR') complexity = 'COMPLEX';
        reasoning.push('Seismic upgrade requirements increase complexity');
      }
      
      if (customFactors.asbestosPresent) {
        if (complexity === 'SIMPLE') complexity = 'MODERATE';
        reasoning.push('Asbestos abatement adds complexity');
      }
    }
    
    res.json({
      data: {
        complexity,
        confidence,
        reasoning,
        suggestedReadinessItems: metadata.readinessChecklist,
        metadata: {
          requiresArchitect: metadata.requiresArchitect,
          requiresStructuralEngineer: metadata.requiresStructuralEngineer,
          requiresMEPEngineer: metadata.requiresMEPEngineer,
          typicalDuration: metadata.typicalDuration,
          permitComplexity: metadata.permitComplexity
        }
      }
    });
    
  } catch (error) {
    logger.error('Error assessing complexity', { error });
    res.status(500).json({ message: 'Failed to assess complexity' });
  }
});

export { router as projectTypesRouter };
