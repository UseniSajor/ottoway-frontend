import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReviewService {
  /**
   * Check if reviews are locked (must be completed + final payment)
   */
  static async isReviewLocked(projectId: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrowAgreements: {
          include: { transactions: true },
        },
      },
    });

    if (!project) {
      return true; // Lock if project not found
    }

    // Check if project is completed (TODO: Add project status field)
    // For now, check if all milestones are paid
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
    });

    const allPaid = milestones.every((m) => m.status === 'PAID');
    if (!allPaid) {
      return true; // Lock if not all milestones paid
    }

    // Check final payment
    const escrow = project.escrowAgreements[0];
    if (escrow) {
      const finalPayment = escrow.transactions.find(
        (t) => t.type === 'RELEASE' && t.status === 'COMPLETED'
      );
      if (!finalPayment) {
        return true; // Lock if no final payment
      }
    }

    return false; // Unlock if all conditions met
  }
}



