import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  confidence: number;
  projectId: string;
}

export class MLService {
  /**
   * Generate recommendations based on rules + scoring
   */
  static async generateRecommendations(projectId: string): Promise<Recommendation[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contractAgreements: true,
        permitSets: true,
        readinessChecklists: {
          include: { items: true },
        },
        milestones: true,
      },
    });

    if (!project) {
      return [];
    }

    const recommendations: Recommendation[] = [];

    // Rule-based recommendations
    if (project.contractAgreements.length === 0) {
      recommendations.push({
        type: 'CONTRACT',
        title: 'Create Contract Agreement',
        description: 'Project requires a contract agreement before proceeding',
        confidence: 0.9,
        projectId,
      });
    }

    if (project.readinessChecklists.length === 0) {
      recommendations.push({
        type: 'READINESS',
        title: 'Start Readiness Checklist',
        description: 'Begin readiness checklist to prepare for permit submission',
        confidence: 0.85,
        projectId,
      });
    }

    // TODO: Add LLM-based recommendations via Anthropic adapter
    // const llmRecommendations = await this.getLLMRecommendations(project);
    // recommendations.push(...llmRecommendations);

    // Save recommendations
    for (const rec of recommendations) {
      await prisma.recommendation.create({
        data: {
          projectId: rec.projectId,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          confidence: rec.confidence,
          status: 'PENDING',
        },
      });
    }

    return recommendations;
  }

  /**
   * Calculate model scores (permit risk, dispute risk, schedule slip, cost overrun)
   */
  static async calculateModelScores(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contractAgreements: true,
        disputes: true,
        milestones: true,
      },
    });

    if (!project) {
      return;
    }

    // Permit risk score (simple heuristic)
    const hasContract = project.contractAgreements.some((c) => c.status === 'FULLY_SIGNED');
    const permitRisk = hasContract ? 0.3 : 0.8;

    // Dispute risk score
    const hasDisputes = project.disputes.length > 0;
    const disputeRisk = hasDisputes ? 0.7 : 0.2;

    // Schedule slip risk (simple heuristic based on complexity)
    const scheduleRisk = {
      SIMPLE: 0.2,
      MODERATE: 0.4,
      COMPLEX: 0.6,
      MAJOR: 0.8,
    }[project.complexity] || 0.5;

    // Cost overrun risk
    const costRisk = {
      SIMPLE: 0.15,
      MODERATE: 0.3,
      COMPLEX: 0.5,
      MAJOR: 0.7,
    }[project.complexity] || 0.4;

    // Save scores
    await Promise.all([
      prisma.modelScore.create({
        data: {
          projectId,
          modelType: 'PERMIT_RISK',
          score: permitRisk,
        },
      }),
      prisma.modelScore.create({
        data: {
          projectId,
          modelType: 'DISPUTE_RISK',
          score: disputeRisk,
        },
      }),
      prisma.modelScore.create({
        data: {
          projectId,
          modelType: 'SCHEDULE_SLIP_RISK',
          score: scheduleRisk,
        },
      }),
      prisma.modelScore.create({
        data: {
          projectId,
          modelType: 'COST_OVERRUN_RISK',
          score: costRisk,
        },
      }),
    ]);
  }

  /**
   * Guardrail: Check if action requires human confirmation
   */
  static requiresHumanConfirmation(actionType: string): boolean {
    const restrictedActions = [
      'PERMIT_SUBMIT',
      'ESCROW_RELEASE',
      'CONTRACT_SIGN',
      'DISPUTE_RESOLVE',
    ];

    return restrictedActions.some((action) => actionType.includes(action));
  }

  /**
   * Execute automation action (with guardrails)
   */
  static async executeAutomationAction(
    ruleId: string,
    actionType: string,
    parameters: any,
    requiresHumanConfirmation: boolean = false
  ) {
    // Guardrail: reject if action requires human confirmation but flag is false
    if (this.requiresHumanConfirmation(actionType) && !requiresHumanConfirmation) {
      throw new Error('AUTOMATION_BLOCKED: This action requires human confirmation');
    }

    // Log action
    const action = await prisma.automationAction.create({
      data: {
        ruleId,
        actionType,
        parameters,
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: parameters.projectId || '',
        eventType: 'AUTOMATION_ACTION_EXECUTED',
        payload: { actionId: action.id, actionType, parameters },
      },
    });

    return action;
  }
}



