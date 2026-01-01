import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Backward compatibility migration script
 * Migrates old type flags to new enums and remaps roles as needed
 */
async function migrateBackwardCompatibility() {
  console.log('Starting backward compatibility migration...');

  try {
    // 1. Migrate old project type flags to new ProjectType enum
    // If there are old projects with string types, ensure they map to valid enums
    const projects = await prisma.project.findMany({
      where: {
        // Find projects that might have old format
        projectType: {
          notIn: [
            'NEW_CONSTRUCTION_RESIDENTIAL',
            'WHOLE_HOUSE_RENOVATION',
            'ADDITION_EXPANSION',
            'INTERIOR_RENOVATION_LIGHT',
            'INTERIOR_RENOVATION_MAJOR',
            'KITCHEN_BATH_REMODEL',
            'BASEMENT_FINISH',
            'ACCESSIBILITY_MODIFICATIONS',
            'NEW_CONSTRUCTION_COMMERCIAL',
            'TENANT_IMPROVEMENT_OFFICE',
            'TENANT_IMPROVEMENT_RETAIL',
            'TENANT_IMPROVEMENT_RESTAURANT',
            'COMMERCIAL_RENOVATION',
            'STOREFRONT_FACADE',
            'WAREHOUSE_BUILDOUT',
            'MANUFACTURING_FACILITY',
            'INDUSTRIAL_RENOVATION',
            'SCHOOL_FACILITY',
            'HEALTHCARE_FACILITY',
            'GOVERNMENT_BUILDING',
            'MIXED_USE_DEVELOPMENT',
          ],
        },
      },
    });

    const typeMapping: Record<string, string> = {
      'new_construction': 'NEW_CONSTRUCTION_RESIDENTIAL',
      'renovation': 'WHOLE_HOUSE_RENOVATION',
      'addition': 'ADDITION_EXPANSION',
      'kitchen_bath': 'KITCHEN_BATH_REMODEL',
      'commercial_tenant': 'TENANT_IMPROVEMENT_OFFICE',
      'warehouse': 'WAREHOUSE_BUILDOUT',
      // Add more mappings as needed
    };

    for (const project of projects) {
      const oldType = (project as any).oldProjectType || project.projectType;
      const newType = typeMapping[oldType] || 'NEW_CONSTRUCTION_RESIDENTIAL';

      await prisma.project.update({
        where: { id: project.id },
        data: { projectType: newType as any },
      });

      console.log(`Migrated project ${project.id}: ${oldType} -> ${newType}`);
    }

    // 2. Remap old roles to new UserRole enum
    const users = await prisma.user.findMany();
    const roleMapping: Record<string, string> = {
      'owner': 'HOMEOWNER',
      'home_owner': 'HOMEOWNER',
      'business_owner': 'BUSINESS_OWNER',
      'project_manager': 'PROJECT_MANAGER',
      'pm': 'PROJECT_MANAGER',
      'contractor': 'PRIME_CONTRACTOR',
      'prime_contractor': 'PRIME_CONTRACTOR',
      'sub_contractor': 'SUBCONTRACTOR',
      'subcontractor': 'SUBCONTRACTOR',
      'admin': 'ADMIN',
      'operator': 'PLATFORM_OPERATOR',
    };

    for (const user of users) {
      const oldRole = (user as any).oldRole || user.role;
      const newRole = roleMapping[oldRole.toLowerCase()] || user.role;

      if (newRole !== user.role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: newRole as any },
        });

        console.log(`Migrated user ${user.id}: ${oldRole} -> ${newRole}`);
      }
    }

    // 3. Migrate old complexity flags to new ProjectComplexity enum
    const projectsWithOldComplexity = await prisma.project.findMany({
      where: {
        complexity: {
          notIn: ['SIMPLE', 'MODERATE', 'COMPLEX', 'MAJOR'],
        },
      },
    });

    const complexityMapping: Record<string, string> = {
      'low': 'SIMPLE',
      'medium': 'MODERATE',
      'high': 'COMPLEX',
      'very_high': 'MAJOR',
      '1': 'SIMPLE',
      '2': 'MODERATE',
      '3': 'COMPLEX',
      '4': 'MAJOR',
    };

    for (const project of projectsWithOldComplexity) {
      const oldComplexity = (project as any).oldComplexity || project.complexity;
      const newComplexity = complexityMapping[oldComplexity.toLowerCase()] || 'MODERATE';

      await prisma.project.update({
        where: { id: project.id },
        data: { complexity: newComplexity as any },
      });

      console.log(`Migrated project ${project.id} complexity: ${oldComplexity} -> ${newComplexity}`);
    }

    console.log('Backward compatibility migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateBackwardCompatibility()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { migrateBackwardCompatibility };



