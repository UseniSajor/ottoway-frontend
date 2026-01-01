import { PrismaClient } from '@prisma/client';
import { enforcePermitSubmissionRules } from '../middleware/workflowRules.js';

const prisma = new PrismaClient();

export interface PermitBlockingReason {
  type: 'CONTRACT_NOT_SIGNED' | 'DESIGN_NOT_APPROVED' | 'READINESS_INCOMPLETE';
  message: string;
}

export class PermitService {
  /**
   * Check if permit submission is allowed and return blocking reasons
   */
  static async checkPermitSubmission(projectId: string): Promise<{
    allowed: boolean;
    blockingReasons: PermitBlockingReason[];
  }> {
    const blockingReasons: PermitBlockingReason[] = [];

    // Check contract status
    const contract = await prisma.contractAgreement.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract || contract.status !== 'FULLY_SIGNED') {
      blockingReasons.push({
        type: 'CONTRACT_NOT_SIGNED',
        message: 'Contract must be fully signed before permit submission',
      });
    }

    // Check design approval
    const design = await prisma.designVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    if (!design || design.status !== 'APPROVED_FOR_PERMIT') {
      blockingReasons.push({
        type: 'DESIGN_NOT_APPROVED',
        message: 'Design must be approved for permit before submission',
      });
    }

    // Check readiness items
    const readiness = await prisma.readinessChecklist.findFirst({
      where: { projectId },
      include: { items: true },
    });

    if (readiness) {
      const incompleteItems = readiness.items.filter(
        (item) => item.status !== 'COMPLETED'
      );
      if (incompleteItems.length > 0) {
        blockingReasons.push({
          type: 'READINESS_INCOMPLETE',
          message: `Required readiness items must be completed (${incompleteItems.length} remaining)`,
        });
      }
    }

    return {
      allowed: blockingReasons.length === 0,
      blockingReasons,
    };
  }

  /**
   * Submit permit (with blocking check)
   */
  static async submitPermit(projectId: string, submittedBy: string) {
    // ENFORCE WORKFLOW RULES (uses same logic as checkPermitSubmission)
    try {
      await enforcePermitSubmissionRules(projectId);
    } catch (error: any) {
      throw new Error('PERMIT_BLOCKED');
    }

    const permit = await prisma.permitSet.create({
      data: {
        projectId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId,
        eventType: 'PERMIT_SUBMITTED',
        eventData: { permitId: permit.id },
        userId: submittedBy,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: submittedBy,
        action: 'PERMIT_SUBMITTED',
        resource: 'PermitSet',
        resourceId: permit.id,
      },
    });

    return permit;
  }
}



