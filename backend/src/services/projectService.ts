import { PrismaClient, ProjectType, ProjectComplexity } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectService {
  /**
   * Create project - MUST require project_type and set complexity suggestion
   */
  static async createProject(data: {
    propertyId?: string;
    name: string;
    description?: string;
    category: string;
    projectType: ProjectType; // REQUIRED
    complexity?: ProjectComplexity; // Optional override
    squareFootage?: number;
    unitCount?: number;
    jurisdictionCity?: string;
    jurisdictionState?: string;
    jurisdictionCounty?: string;
    createdBy: string;
    ownerId?: string;
  }) {
    if (!data.projectType) {
      throw new Error('project_type is required');
    }

    // Auto-suggest complexity if not provided
    let complexity = data.complexity;
    if (!complexity) {
      complexity = await this.suggestComplexity(data.projectType, data.category);
    }

    // Combine jurisdiction fields into single string if schema uses jurisdiction
    const jurisdiction = data.jurisdictionCity || data.jurisdictionState || data.jurisdictionCounty
      ? [data.jurisdictionCity, data.jurisdictionState, data.jurisdictionCounty]
          .filter(Boolean)
          .join(', ')
      : undefined;

    const project = await prisma.project.create({
      data: {
        ownerId: data.ownerId || data.createdBy, // Use ownerId if provided, otherwise use createdBy
        propertyId: data.propertyId,
        name: data.name,
        description: data.description,
        category: data.category as any,
        projectType: data.projectType,
        complexity,
        squareFootage: data.squareFootage,
        unitCount: data.unitCount,
        jurisdiction, // Schema uses single jurisdiction field
        permitAuthority: undefined, // Can be added later
      },
    });

    // Log event
    await prisma.projectEvent.create({
      data: {
        projectId: project.id,
        eventType: 'PROJECT_CREATED',
        payload: { projectType: data.projectType, complexity },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: data.createdBy,
        action: 'PROJECT_CREATED',
        resource: 'Project',
        resourceId: project.id,
      },
    });

    return project;
  }

  /**
   * Suggest complexity based on project type
   */
  private static async suggestComplexity(
    projectType: ProjectType,
    category: string
  ): Promise<ProjectComplexity> {
    // Simple heuristic based on project type
    const majorTypes: ProjectType[] = [
      'NEW_CONSTRUCTION_RESIDENTIAL',
      'NEW_CONSTRUCTION_COMMERCIAL',
      'WHOLE_HOUSE_RENOVATION',
      'MIXED_USE_DEVELOPMENT',
      'MANUFACTURING_FACILITY',
      'SCHOOL_FACILITY',
      'HEALTHCARE_FACILITY',
      'GOVERNMENT_BUILDING',
    ];

    const complexTypes: ProjectType[] = [
      'ADDITION_EXPANSION',
      'INTERIOR_RENOVATION_MAJOR',
      'COMMERCIAL_RENOVATION',
      'INDUSTRIAL_RENOVATION',
    ];

    if (majorTypes.includes(projectType)) {
      return 'MAJOR';
    }
    if (complexTypes.includes(projectType)) {
      return 'COMPLEX';
    }
    if (projectType.includes('LIGHT') || projectType === 'KITCHEN_BATH_REMODEL') {
      return 'SIMPLE';
    }

    return 'MODERATE';
  }

  /**
   * Get project with all relations
   */
  static async getProject(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        property: true,
        contractAgreements: true,
        permitSets: true,
        escrowAgreements: true,
        milestones: true,
      },
    });
  }
}



