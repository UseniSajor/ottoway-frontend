import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StripeConnectAdapter {
  createAccount(email: string): Promise<{ accountId: string; onboardingUrl: string }>;
  getAccountStatus(accountId: string): Promise<'pending' | 'active' | 'restricted'>;
  createTransfer(accountId: string, amount: number, description: string): Promise<{ transferId: string }>;
}

// TODO: Implement real Stripe Connect integration
// For now, this is a structured adapter with clear stubs
class StripeConnectAdapterImpl implements StripeConnectAdapter {
  async createAccount(email: string): Promise<{ accountId: string; onboardingUrl: string }> {
    // TODO: Implement Stripe Connect account creation
    // const account = await stripe.accounts.create({ type: 'express', email });
    // const link = await stripe.accountLinks.create({ account: account.id, ... });
    return {
      accountId: `stripe_account_${Date.now()}`,
      onboardingUrl: `https://stripe.com/onboarding/${Date.now()}`,
    };
  }

  async getAccountStatus(accountId: string): Promise<'pending' | 'active' | 'restricted'> {
    // TODO: Implement Stripe account status check
    // const account = await stripe.accounts.retrieve(accountId);
    return 'active';
  }

  async createTransfer(accountId: string, amount: number, description: string): Promise<{ transferId: string }> {
    // TODO: Implement Stripe transfer
    // const transfer = await stripe.transfers.create({ destination: accountId, amount, ... });
    return { transferId: `transfer_${Date.now()}` };
  }
}

const stripeAdapter = new StripeConnectAdapterImpl();

export class EscrowService {
  /**
   * Check if escrow release is allowed
   */
  static async checkReleaseAllowed(
    escrowId: string,
    milestoneId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        project: {
          include: { disputes: true },
        },
      },
    });

    if (!escrow) {
      return { allowed: false, reason: 'Escrow not found' };
    }

    // Check for active disputes
    const activeDispute = escrow.project.disputes.find(
      (d) => d.status === 'OPEN' || d.status === 'IN_REVIEW'
    );
    if (activeDispute) {
      return {
        allowed: false,
        reason: 'Escrow releases are frozen due to active dispute',
      };
    }

    // Check milestone verification
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        verificationItems: {
          include: { receipts: true },
        },
      },
    });

    if (!milestone) {
      return { allowed: false, reason: 'Milestone not found' };
    }

    // All verification items must be verified
    const unverifiedItems = milestone.verificationItems.filter(
      (item) => item.status !== 'VERIFIED'
    );
    if (unverifiedItems.length > 0) {
      return {
        allowed: false,
        reason: 'All verification items must be verified before release',
      };
    }

    return { allowed: true };
  }

  /**
   * Request escrow release (requires evidence + human approval)
   */
  static async requestRelease(
    escrowId: string,
    milestoneId: string,
    requestedBy: string
  ) {
    const check = await this.checkReleaseAllowed(escrowId, milestoneId);

    if (!check.allowed) {
      throw new Error(`RELEASE_BLOCKED: ${check.reason}`);
    }

    // Create release transaction (pending approval)
    const transaction = await prisma.escrowTransaction.create({
      data: {
        escrowId,
        type: 'RELEASE',
        amount: (await prisma.milestone.findUnique({ where: { id: milestoneId } }))?.amount || 0,
        status: 'PENDING',
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: (await prisma.escrowAgreement.findUnique({ where: { id: escrowId } }))?.projectId || '',
        eventType: 'ESCROW_RELEASE_REQUESTED',
        payload: { transactionId: transaction.id, milestoneId },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: requestedBy,
        action: 'ESCROW_RELEASE_REQUESTED',
        resource: 'EscrowTransaction',
        resourceId: transaction.id,
      },
    });

    return transaction;
  }

  /**
   * Approve escrow release (human approval required)
   */
  static async approveRelease(
    transactionId: string,
    approvedBy: string,
    requiresHumanConfirmation: boolean = true
  ) {
    if (requiresHumanConfirmation) {
      // This should only be called by human users, not automation
      // Guardrail: reject if called automatically
      throw new Error('ESCROW_RELEASE_REQUIRES_HUMAN_APPROVAL');
    }

    const transaction = await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    // Execute transfer via Stripe
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: transaction.escrowId },
      include: { project: true },
    });

    // TODO: Get Stripe Connect account ID from contractor
    // For now, stub
    // const transfer = await stripeAdapter.createTransfer(accountId, transaction.amount, ...);

    // Update transaction status
    await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED' },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: escrow?.projectId || '',
        eventType: 'ESCROW_RELEASE_APPROVED',
        payload: { transactionId },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: approvedBy,
        action: 'ESCROW_RELEASE_APPROVED',
        resource: 'EscrowTransaction',
        resourceId: transactionId,
      },
    });

    return transaction;
  }

  /**
   * Create Stripe Connect account for contractor
   */
  static async createStripeAccount(contractorId: string, email: string) {
    const account = await stripeAdapter.createAccount(email);

    // TODO: Store Stripe account ID in User or Organization
    // await prisma.user.update({ where: { id: contractorId }, data: { stripeAccountId: account.accountId } });

    return account;
  }
}



