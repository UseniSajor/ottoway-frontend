import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// For Claude API integration (commented out until ANTHROPIC_API_KEY is available)
// import Anthropic from '@anthropic-ai/sdk';
// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY
// });

export class MLEngine {
  // Extract features from project for ML models
  async extractProjectFeatures(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contracts: {
          include: {
            milestones: true,
          },
        },
        designVersions: true,
        readinessChecklist: {
          include: {
            items: true,
          },
        },
        permitSets: true,
        escrowAgreement: {
          include: {
            transactions: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, role: true },
            },
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const createdAt = new Date(project.createdAt);
    const now = new Date();
    const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Timeline features
    const timelineFeatures = {
      daysActive,
      daysSinceLastUpdate: Math.floor(
        (now.getTime() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      currentPhase: project.status,
      phaseTransitions: project.events.filter((e) => e.eventType === 'STATUS_CHANGE').length,
    };

    // Financial features
    const allMilestones = project.contracts.flatMap((c) => c.milestones);
    const totalMilestones = allMilestones.length;
    const completedMilestones = allMilestones.filter((m) => m.status === 'COMPLETED').length;

    const financialFeatures = {
      totalMilestones,
      completedMilestones,
      milestoneCompletionRate: totalMilestones > 0 ? completedMilestones / totalMilestones : 0,
      escrowFunded: project.escrowAgreement?.funded || false,
      escrowFundedAmount: Number(project.escrowAgreement?.fundedAmount || 0),
    };

    // Team features
    const teamFeatures = {
      teamSize: project.members.length,
      hasContractor: project.contracts.length > 0,
      hasPM: project.members.some((m) => m.role === 'PROJECT_MANAGER'),
      hasDesigner: project.members.some(
        (m) => m.role === 'DESIGNER' || m.role === 'ARCHITECT'
      ),
    };

    // Progress features
    const totalReadinessItems = project.readinessChecklist?.items.length || 0;
    const completedReadinessItems =
      project.readinessChecklist?.items.filter((i) => i.status === 'COMPLETED').length || 0;

    const progressFeatures = {
      readinessProgress:
        totalReadinessItems > 0 ? completedReadinessItems / totalReadinessItems : 0,
      designVersions: project.designVersions.length,
      approvedDesigns: project.designVersions.filter((d) => d.status === 'APPROVED_FOR_PERMIT')
        .length,
      permitSets: project.permitSets.length,
      issuedPermits: project.permitSets.filter((ps) => ps.status === 'APPROVED').length,
    };

    // Risk features
    const overdueMilestones = allMilestones.filter(
      (m) => m.completedAt && new Date(m.completedAt) < now && m.status !== 'COMPLETED'
    ).length;

    const riskFeatures = {
      overdueMilestones,
      contractsNotSigned: project.contracts.filter(
        (c) => c.status !== 'FULLY_SIGNED'
      ).length,
      designsNotApproved: project.designVersions.filter(
        (d) => d.status !== 'APPROVED_FOR_PERMIT'
      ).length,
      incompleteRequiredReadiness:
        project.readinessChecklist?.items.filter(
          (i) => i.required && i.status !== 'COMPLETED'
        ).length || 0,
    };

    const featureData = {
      projectType: project.projectType,
      category: project.category,
      complexity: project.complexity,
      timelineFeatures,
      financialFeatures,
      teamFeatures,
      progressFeatures,
      riskFeatures,
    };

    // Save snapshot
    await prisma.mLFeatureSnapshot.create({
      data: {
        projectId,
        featureData,
        timelineFeatures,
        financialFeatures,
        teamFeatures,
        progressFeatures,
        riskFeatures,
        snapshotReason: 'SCHEDULED',
      },
    });

    logger.info('Project features extracted', { projectId });
    return featureData;
  }

  // Generate permit risk score
  async assessPermitRisk(projectId: string): Promise<number> {
    const features = await this.extractProjectFeatures(projectId);

    let riskScore = 0.5; // Base score

    // Increase risk if contracts not signed
    if (features.riskFeatures.contractsNotSigned > 0) {
      riskScore += 0.2;
    }

    // Increase risk if designs not approved
    if (features.riskFeatures.designsNotApproved > 0) {
      riskScore += 0.15;
    }

    // Increase risk if required readiness incomplete
    if (features.riskFeatures.incompleteRequiredReadiness > 0) {
      riskScore += 0.1 * features.riskFeatures.incompleteRequiredReadiness;
    }

    // Decrease risk if good progress
    if (features.progressFeatures.readinessProgress > 0.8) {
      riskScore -= 0.15;
    }

    // Cap between 0 and 1
    riskScore = Math.max(0, Math.min(1, riskScore));

    // Save score
    await prisma.modelScore.create({
      data: {
        projectId,
        modelName: 'permit_risk',
        modelVersion: '1.0',
        scoreType: 'permit_risk',
        score: riskScore,
        confidence: 0.75,
        isHighRisk: riskScore > 0.7,
        riskLevel: riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW',
        explanation: {
          summary: `Permit submission risk is ${riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low'}`,
          factors: {
            contractsNotSigned: features.riskFeatures.contractsNotSigned,
            designsNotApproved: features.riskFeatures.designsNotApproved,
            incompleteReadiness: features.riskFeatures.incompleteRequiredReadiness,
          },
        },
        contributingFactors: features.riskFeatures,
      },
    });

    logger.info('Permit risk assessed', { projectId, riskScore });
    return riskScore;
  }

  // Generate next best action recommendation
  async generateNextBestAction(projectId: string) {
    const features = await this.extractProjectFeatures(projectId);

    const context = `
Project Status: ${features.timelineFeatures.currentPhase}
Days Active: ${features.timelineFeatures.daysActive}
Readiness Progress: ${(features.progressFeatures.readinessProgress * 100).toFixed(0)}%
Milestone Completion: ${(features.financialFeatures.milestoneCompletionRate * 100).toFixed(0)}%
Team Size: ${features.teamFeatures.teamSize}

Risk Indicators:
- Overdue Milestones: ${features.riskFeatures.overdueMilestones}
- Unsigned Contracts: ${features.riskFeatures.contractsNotSigned}
- Unapproved Designs: ${features.riskFeatures.designsNotApproved}
- Incomplete Required Readiness: ${features.riskFeatures.incompleteRequiredReadiness}
    `;

    // For now, create a mock recommendation without Claude API
    // TODO: Integrate Claude API when ANTHROPIC_API_KEY is available
    let recommendationData: any;

    if (process.env.ANTHROPIC_API_KEY) {
      // Uncomment when Claude API is available
      // const message = await anthropic.messages.create({
      //   model: 'claude-sonnet-4-20250514',
      //   max_tokens: 1000,
      //   messages: [{
      //     role: 'user',
      //     content: `Based on this construction project data, what is the single most important next action the project owner should take?
      //
      // ${context}
      //
      // Respond ONLY with a JSON object in this exact format:
      // {
      //   "type": "NEXT_ACTION",
      //   "title": "Clear action title",
      //   "description": "Detailed description",
      //   "priority": 8,
      //   "reasoning": "Why this is the most important action",
      //   "confidence": 0.85,
      //   "estimatedImpact": "HIGH",
      //   "estimatedEffort": "MEDIUM"
      // }`
      //   }]
      // });
      //
      // const responseText = message.content[0].type === 'text'
      //   ? message.content[0].text
      //   : '{}';
      //
      // recommendationData = JSON.parse(responseText);
    } else {
      // Fallback: Generate simple recommendation based on risk factors
      let title = 'Complete Required Readiness Items';
      let description = 'Focus on completing required readiness checklist items to move forward.';
      let priority = 7;

      if (features.riskFeatures.contractsNotSigned > 0) {
        title = 'Sign Project Contract';
        description = 'Complete contract signing to proceed with the project.';
        priority = 9;
      } else if (features.riskFeatures.designsNotApproved > 0) {
        title = 'Approve Design for Permit';
        description = 'Review and approve design documents for permit submission.';
        priority = 8;
      }

      recommendationData = {
        type: 'NEXT_ACTION',
        title,
        description,
        priority,
        reasoning: `Based on project status: ${context}`,
        confidence: 0.75,
        estimatedImpact: 'HIGH',
        estimatedEffort: 'MEDIUM',
      };
    }

    // Create recommendation in database
    const created = await prisma.recommendation.create({
      data: {
        projectId,
        type: recommendationData.type,
        title: recommendationData.title,
        description: recommendationData.description,
        priority: recommendationData.priority,
        reasoning: {
          explanation: recommendationData.reasoning,
          aiGenerated: true,
          model: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-20250514' : 'rule-based',
        },
        confidence: recommendationData.confidence,
        estimatedImpact: recommendationData.estimatedImpact,
        estimatedEffort: recommendationData.estimatedEffort,
        status: 'ACTIVE',
      },
    });

    logger.info('Recommendation generated', { projectId, recommendationId: created.id });
    return created;
  }
}

export const mlEngine = new MLEngine();

