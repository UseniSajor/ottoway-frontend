import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// MASTER_SPEC RULE: Permit submission blocking
export async function enforcePermitSubmissionRules(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      contracts: true,
      designVersions: true,
      readinessChecklist: {
        include: {
          items: {
            where: { required: true },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const violations: string[] = [];

  // RULE 1: Must have FullySigned contract
  const hasFullySignedContract = project.contracts.some(
    (c: { status: string }) => c.status === 'FULLY_SIGNED'
  );

  if (!hasFullySignedContract) {
    violations.push('Contract must be fully signed before permit submission');
  }

  // RULE 2: Must have ApprovedForPermit design
  const hasApprovedDesign = project.designVersions.some(
    (d: { status: string }) => d.status === 'APPROVED_FOR_PERMIT'
  );

  if (!hasApprovedDesign) {
    violations.push('Design must be approved for permit before submission');
  }

  // RULE 3: All required readiness items must be complete
  if (project.readinessChecklist) {
    const incompleteRequired = project.readinessChecklist.items.filter(
      (item: { status: string }) => item.status !== 'COMPLETED'
    );

    if (incompleteRequired.length > 0) {
      violations.push(
        `${incompleteRequired.length} required readiness items must be completed: ${incompleteRequired.map((i: { title: string }) => i.title).join(', ')}`
      );
    }
  }

  if (violations.length > 0) {
    const errorMessage = `Permit submission blocked: ${violations.join('; ')}`;
    logger.warn('Permit submission blocked', { projectId, violations });
    throw new Error(errorMessage);
  }

  logger.info('Permit submission rules passed', { projectId });
  return true;
}

// MASTER_SPEC RULE: Escrow release verification
export async function enforceEscrowReleaseRules(transactionId: string) {
  const transaction = await prisma.escrowTransaction.findUnique({
    where: { id: transactionId },
    include: {
      receipts: true,
      milestone: true,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const violations: string[] = [];

  // RULE 1: Must have receipts
  if (transaction.receipts.length === 0) {
    violations.push('At least one receipt must be uploaded');
  }

  // RULE 2: All receipts must be verified
  const unverifiedReceipts = transaction.receipts.filter((r) => !r.verified);
  if (unverifiedReceipts.length > 0) {
    violations.push(`${unverifiedReceipts.length} receipts pending verification`);
  }

  // RULE 3: Human approval required (MASTER_SPEC)
  if (!transaction.approvedById) {
    violations.push('Human approval required for escrow release');
  }

  if (violations.length > 0) {
    const errorMessage = `Escrow release blocked: ${violations.join('; ')}`;
    logger.warn('Escrow release blocked', { transactionId, violations });
    throw new Error(errorMessage);
  }

  logger.info('Escrow release rules passed', { transactionId });
  return true;
}

// MASTER_SPEC RULE: Review locking
export async function enforceReviewSubmissionRules(projectId: string) {
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
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const violations: string[] = [];

  // RULE 1: Project must be completed
  if (project.status !== 'COMPLETED') {
    violations.push('Project must be completed before reviews can be submitted');
  }

  // RULE 2: Closeout must be completed
  if (!project.closeout || project.closeout.status !== 'COMPLETED') {
    violations.push('Project closeout must be completed');
  }

  // RULE 3: Final payment must be released
  if (!project.closeout?.finalPaymentReleased) {
    violations.push('Final payment must be released');
  }

  if (violations.length > 0) {
    const errorMessage = `Review submission blocked: ${violations.join('; ')}`;
    logger.warn('Review submission blocked', { projectId, violations });
    throw new Error(errorMessage);
  }

  logger.info('Review submission rules passed', { projectId });
  return true;
}

// MASTER_SPEC RULE: Contractor invite-only
export async function enforceContractorRegistrationRules(inviteToken?: string) {
  if (!inviteToken) {
    throw new Error('Contractors can only register via invite link');
  }

  const invite = await prisma.subcontractorInvite.findUnique({
    where: { token: inviteToken },
  });

  if (!invite) {
    throw new Error('Invalid invite token');
  }

  if (invite.status !== 'PENDING') {
    throw new Error('Invite has already been used or expired');
  }

  if (new Date() > invite.expiresAt) {
    await prisma.subcontractorInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });
    throw new Error('Invite has expired');
  }

  return invite;
}

// MASTER_SPEC RULE: Subcontractor visibility (MAJOR only)
export function shouldShowSubcontractorManagement(userRole: string, projectComplexity: string): boolean {
  // Only prime contractors
  if (userRole !== 'PRIME_CONTRACTOR') {
    return false;
  }

  // Only MAJOR projects
  if (projectComplexity !== 'MAJOR') {
    return false;
  }

  return true;
}

// MASTER_SPEC RULE: ML automation guardrails
export async function enforceAutomationActionRules(actionType: string) {
  const restrictedActions = ['SUBMIT_PERMIT', 'RELEASE_FUNDS', 'SIGN_CONTRACT', 'RESOLVE_DISPUTE'];

  if (restrictedActions.includes(actionType)) {
    const errorMessage = `Automation action "${actionType}" requires human approval and cannot auto-execute`;
    logger.warn('Automation action blocked', { actionType });
    throw new Error(errorMessage);
  }

  return true;
}

