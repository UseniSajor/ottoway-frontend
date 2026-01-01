import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getProjectTypeMetadata } from '../data/projectTypeMetadata.js';

const router = Router();
const prisma = new PrismaClient();

// Auto-generate project estimate using Claude AI
router.post('/projects/:projectId/generate-estimate', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { projectId } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        property: true
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get project type metadata
    const projectTypeData = PROJECT_TYPE_METADATA[project.projectType] || {};
    
    // Build context for Claude
    const context = {
      projectType: project.projectType,
      category: project.category,
      complexity: project.complexity,
      squareFootage: project.squareFootage || project.property?.squareFootage,
      location: project.property ? `${project.property.city}, ${project.property.state}` : 'Unknown',
      unitCount: project.unitCount || project.property?.unitCount,
      yearBuilt: project.property?.yearBuilt,
      description: project.description,
      projectTypeMetadata: projectTypeData
    };
    
    // Check if Anthropic API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback to rule-based estimate if no API key
      const estimate = generateRuleBasedEstimate(context);
      
      const savedEstimate = await prisma.projectEstimate.create({
        data: {
          projectId,
          estimateData: estimate,
          generatedById: req.user.id,
          source: 'MANUAL',
          status: 'DRAFT'
        }
      });
      
      return res.status(201).json(savedEstimate);
    }
    
    // Call Claude for estimate
    const Anthropic = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic.default({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a construction cost estimator. Generate a detailed project estimate.

Project Details:
${JSON.stringify(context, null, 2)}

Provide estimate in this JSON format:
{
  "totalEstimate": {
    "low": 50000,
    "mid": 75000,
    "high": 100000,
    "currency": "USD"
  },
  "breakdown": [
    {
      "category": "Labor",
      "low": 20000,
      "mid": 30000,
      "high": 40000,
      "percentage": 40
    },
    {
      "category": "Materials",
      "low": 15000,
      "mid": 22500,
      "high": 30000,
      "percentage": 30
    },
    {
      "category": "Permits & Fees",
      "low": 5000,
      "mid": 7500,
      "high": 10000,
      "percentage": 10
    },
    {
      "category": "Contingency",
      "low": 10000,
      "mid": 15000,
      "high": 20000,
      "percentage": 20
    }
  ],
  "timeline": {
    "estimatedDuration": "4-6 months",
    "phases": [
      {"name": "Design & Permitting", "duration": "6-8 weeks"},
      {"name": "Construction", "duration": "12-16 weeks"},
      {"name": "Closeout", "duration": "2-3 weeks"}
    ]
  },
  "assumptions": [
    "Based on current market rates in the region",
    "Assumes standard materials and finishes",
    "Does not include furniture or appliances",
    "Permits estimated based on local jurisdiction"
  ],
  "disclaimer": "This is an AI-generated estimate. Actual costs may vary. Consult with licensed contractors for binding quotes."
}

Return ONLY the JSON, no other text.`
      }]
    });
    
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '{}';
    
    // Extract JSON from response (handle markdown code blocks)
    let estimateJson = responseText.trim();
    if (estimateJson.startsWith('```json')) {
      estimateJson = estimateJson.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (estimateJson.startsWith('```')) {
      estimateJson = estimateJson.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const estimate = JSON.parse(estimateJson);
    
    // Save estimate to database
    const savedEstimate = await prisma.projectEstimate.create({
      data: {
        projectId,
        estimateData: estimate,
        generatedById: req.user.id,
        source: 'AI_GENERATED',
        status: 'DRAFT'
      }
    });
    
    res.status(201).json(savedEstimate);
  } catch (error: any) {
    console.error('Error generating estimate:', error);
    res.status(500).json({ error: 'Failed to generate estimate', message: error.message });
  }
});

// Get estimates for project
router.get('/projects/:projectId/estimates', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { projectId } = req.params;
    
    const estimates = await prisma.projectEstimate.findMany({
      where: { projectId },
      include: {
        generatedBy: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ data: estimates });
  } catch (error: any) {
    console.error('Error fetching estimates:', error);
    res.status(500).json({ error: 'Failed to fetch estimates' });
  }
});

// Approve estimate
router.post('/estimates/:estimateId/approve', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { estimateId } = req.params;
    
    const estimate = await prisma.projectEstimate.update({
      where: { id: estimateId },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date()
      }
    });
    
    res.json({ data: estimate });
  } catch (error: any) {
    console.error('Error approving estimate:', error);
    res.status(500).json({ error: 'Failed to approve estimate' });
  }
});

// Rule-based estimate fallback
function generateRuleBasedEstimate(context: any) {
  const baseCosts: Record<string, { low: number; mid: number; high: number }> = {
    SIMPLE: { low: 10000, mid: 25000, high: 50000 },
    MODERATE: { low: 50000, mid: 100000, high: 200000 },
    COMPLEX: { low: 200000, mid: 400000, high: 800000 },
    MAJOR: { low: 500000, mid: 1000000, high: 2000000 }
  };
  
  const base = baseCosts[context.complexity] || baseCosts.MODERATE;
  const sqftMultiplier = context.squareFootage ? context.squareFootage / 1000 : 1;
  
  const totalLow = Math.round(base.low * sqftMultiplier);
  const totalMid = Math.round(base.mid * sqftMultiplier);
  const totalHigh = Math.round(base.high * sqftMultiplier);
  
  return {
    totalEstimate: {
      low: totalLow,
      mid: totalMid,
      high: totalHigh,
      currency: 'USD'
    },
    breakdown: [
      {
        category: 'Labor',
        low: Math.round(totalLow * 0.4),
        mid: Math.round(totalMid * 0.4),
        high: Math.round(totalHigh * 0.4),
        percentage: 40
      },
      {
        category: 'Materials',
        low: Math.round(totalLow * 0.3),
        mid: Math.round(totalMid * 0.3),
        high: Math.round(totalHigh * 0.3),
        percentage: 30
      },
      {
        category: 'Permits & Fees',
        low: Math.round(totalLow * 0.1),
        mid: Math.round(totalMid * 0.1),
        high: Math.round(totalHigh * 0.1),
        percentage: 10
      },
      {
        category: 'Contingency',
        low: Math.round(totalLow * 0.2),
        mid: Math.round(totalMid * 0.2),
        high: Math.round(totalHigh * 0.2),
        percentage: 20
      }
    ],
    timeline: {
      estimatedDuration: '4-6 months',
      phases: [
        { name: 'Design & Permitting', duration: '6-8 weeks' },
        { name: 'Construction', duration: '12-16 weeks' },
        { name: 'Closeout', duration: '2-3 weeks' }
      ]
    },
    assumptions: [
      'Based on current market rates',
      'Assumes standard materials and finishes',
      'Does not include furniture or appliances',
      'Permits estimated based on local jurisdiction'
    ],
    disclaimer: 'This is a rule-based estimate. Actual costs may vary. Consult with licensed contractors for binding quotes.'
  };
}

export { router as estimatesRouter };

