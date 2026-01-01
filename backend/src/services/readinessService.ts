import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReadinessService {
  /**
   * Readiness can start without a contract (per spec)
   */
  static async createReadinessChecklist(projectId: string) {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Create readiness checklist (no contract requirement)
    const checklist = await prisma.readinessChecklist.create({
      data: {
        projectId,
      },
    });

    // TODO: Create default readiness items based on project type
    // For now, return empty checklist

    return checklist;
  }

  /**
   * Get readiness checklist with items
   */
  static async getReadinessChecklist(projectId: string) {
    const checklist = await prisma.readinessChecklist.findFirst({
      where: { projectId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return checklist;
  }

  /**
   * Complete readiness item
   */
  static async completeItem(itemId: string, completedBy: string) {
    const item = await prisma.readinessItem.update({
      where: { id: itemId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Log event
    const checklist = await prisma.readinessChecklist.findUnique({
      where: { id: item.checklistId },
    });

    if (checklist) {
      await prisma.projectEvent.create({
        data: {
          projectId: checklist.projectId,
          eventType: 'READINESS_ITEM_COMPLETED',
          payload: { itemId, title: item.title },
        },
      });
    }

    return item;
  }
}



