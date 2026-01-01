import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContractorInvite {
  email: string;
  companyName: string;
  contactName: string;
  invitedBy: string; // userId
}

export class ContractorService {
  /**
   * Create contractor invite (only admins can invite)
   */
  static async createInvite(data: ContractorInvite) {
    // TODO: Send invite email with unique token
    const invite = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: 'PENDING_INVITE', // Will be set when they accept
        firstName: data.contactName.split(' ')[0] || '',
        lastName: data.contactName.split(' ').slice(1).join(' ') || '',
        role: 'PRIME_CONTRACTOR',
        // TODO: Add organization with companyName
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: data.invitedBy,
        action: 'CONTRACTOR_INVITE_CREATED',
        resource: 'User',
        resourceId: invite.id,
        details: { email: data.email, companyName: data.companyName },
      },
    });

    return invite;
  }

  /**
   * Check if contractor is approved (required for certain operations)
   */
  static async isApproved(contractorId: string): Promise<boolean> {
    const contractor = await prisma.user.findUnique({
      where: { id: contractorId },
      select: { role: true },
    });

    if (!contractor || (contractor.role !== 'PRIME_CONTRACTOR' && contractor.role !== 'SUBCONTRACTOR')) {
      return false;
    }

    // TODO: Add approval status field to User or Organization
    // For now, assume all contractors with role are approved
    // In production, add explicit approval workflow
    return true;
  }

  /**
   * Approve contractor (admin only)
   */
  static async approveContractor(contractorId: string, approvedBy: string) {
    // TODO: Update approval status
    await prisma.auditLog.create({
      data: {
        userId: approvedBy,
        action: 'CONTRACTOR_APPROVED',
        resource: 'User',
        resourceId: contractorId,
      },
    });
  }

  /**
   * Reject contractor (admin only)
   */
  static async rejectContractor(contractorId: string, rejectedBy: string, reason?: string) {
    // TODO: Update rejection status
    await prisma.auditLog.create({
      data: {
        userId: rejectedBy,
        action: 'CONTRACTOR_REJECTED',
        resource: 'User',
        resourceId: contractorId,
        details: { reason },
      },
    });
  }
}



