import { PrismaClient, UserRole, ProjectCategory, ProjectType, ProjectComplexity } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users for each role
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'homeowner@demo.com',
      firstName: 'John',
      lastName: 'Homeowner',
      role: 'HOMEOWNER' as UserRole,
    },
    {
      email: 'businessowner@demo.com',
      firstName: 'Jane',
      lastName: 'Business',
      role: 'BUSINESS_OWNER' as UserRole,
    },
    {
      email: 'pm@demo.com',
      firstName: 'Project',
      lastName: 'Manager',
      role: 'PROJECT_MANAGER' as UserRole,
    },
    {
      email: 'contractor@demo.com',
      firstName: 'Prime',
      lastName: 'Contractor',
      role: 'PRIME_CONTRACTOR' as UserRole,
    },
    {
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as UserRole,
    },
    {
      email: 'operator@demo.com',
      firstName: 'Platform',
      lastName: 'Operator',
      role: 'PLATFORM_OPERATOR' as UserRole,
    },
  ];

  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          ...user,
          passwordHash,
        },
      })
    )
  );

  console.log(`Created ${createdUsers.length} users`);

  // Create sample properties
  const homeowner = createdUsers.find((u) => u.role === 'HOMEOWNER')!;
  const businessOwner = createdUsers.find((u) => u.role === 'BUSINESS_OWNER')!;

  const properties = [
    {
      ownerId: homeowner.id,
      propertyType: 'Single Family Home',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      squareFootage: 2500,
      yearBuilt: 1985,
      buildingClass: 'B',
    },
    {
      ownerId: homeowner.id,
      propertyType: 'Condo',
      street: '456 Oak Ave',
      city: 'Oakland',
      state: 'CA',
      zipCode: '94601',
      squareFootage: 1200,
      yearBuilt: 2010,
      buildingClass: 'A',
    },
    {
      ownerId: businessOwner.id,
      propertyType: 'Commercial Office',
      street: '789 Business Blvd',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95110',
      squareFootage: 5000,
      yearBuilt: 2000,
      buildingClass: 'A',
    },
  ];

  const createdProperties = await Promise.all(
    properties.map((prop) => prisma.property.create({ data: prop }))
  );

  console.log(`Created ${createdProperties.length} properties`);

  // Create sample projects across categories and types
  const projectTypes: { type: ProjectType; category: ProjectCategory; complexity: ProjectComplexity }[] = [
    { type: 'NEW_CONSTRUCTION_RESIDENTIAL', category: 'RESIDENTIAL', complexity: 'MAJOR' },
    { type: 'KITCHEN_BATH_REMODEL', category: 'RESIDENTIAL', complexity: 'SIMPLE' },
    { type: 'WHOLE_HOUSE_RENOVATION', category: 'RESIDENTIAL', complexity: 'MAJOR' },
    { type: 'TENANT_IMPROVEMENT_OFFICE', category: 'COMMERCIAL', complexity: 'MODERATE' },
    { type: 'TENANT_IMPROVEMENT_RESTAURANT', category: 'COMMERCIAL', complexity: 'COMPLEX' },
    { type: 'WAREHOUSE_BUILDOUT', category: 'INDUSTRIAL', complexity: 'COMPLEX' },
    { type: 'SCHOOL_FACILITY', category: 'INSTITUTIONAL', complexity: 'MAJOR' },
    { type: 'MIXED_USE_DEVELOPMENT', category: 'MIXED_USE', complexity: 'MAJOR' },
  ];

  const projects = await Promise.all(
    projectTypes.map((pt, idx) =>
      prisma.project.create({
        data: {
          propertyId: createdProperties[idx % createdProperties.length].id,
          name: `${pt.type.replace(/_/g, ' ')} Project`,
          description: `Sample ${pt.category.toLowerCase()} project`,
          category: pt.category,
          projectType: pt.type,
          complexity: pt.complexity,
          squareFootage: 1000 + idx * 500,
          jurisdictionCity: 'San Francisco',
          jurisdictionState: 'CA',
        },
      })
    )
  );

  console.log(`Created ${projects.length} projects`);

  // Create some readiness checklists
  for (const project of projects.slice(0, 3)) {
    const checklist = await prisma.readinessChecklist.create({
      data: { projectId: project.id },
    });

    await prisma.readinessItem.createMany({
      data: [
        {
          checklistId: checklist.id,
          title: 'Site Survey Complete',
          description: 'Professional site survey completed',
          status: 'PENDING',
        },
        {
          checklistId: checklist.id,
          title: 'Zoning Verification',
          description: 'Zoning requirements verified',
          status: 'PENDING',
        },
        {
          checklistId: checklist.id,
          title: 'Environmental Review',
          description: 'Environmental impact review completed',
          status: 'COMPLETED',
        },
      ],
    });
  }

  console.log('Created readiness checklists');

  // Create some contracts
  for (const project of projects.slice(0, 2)) {
    await prisma.contractAgreement.create({
      data: {
        projectId: project.id,
        status: 'DRAFT',
        contractUrl: 'https://example.com/contract.pdf',
      },
    });
  }

  console.log('Created contracts');

  // Create some milestones
  for (const project of projects.slice(0, 2)) {
    await prisma.milestone.createMany({
      data: [
        {
          projectId: project.id,
          name: 'Foundation Complete',
          description: 'Foundation work completed',
          amount: 50000,
          status: 'PENDING',
        },
        {
          projectId: project.id,
          name: 'Framing Complete',
          description: 'Framing work completed',
          amount: 75000,
          status: 'PENDING',
        },
      ],
    });
  }

  console.log('Created milestones');

  // Create some notifications
  for (const user of createdUsers.slice(0, 3)) {
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          type: 'INFO',
          title: 'Welcome to Kealee Platform',
          message: 'Your account has been created successfully',
        },
        {
          userId: user.id,
          type: 'SUCCESS',
          title: 'Project Created',
          message: 'Your new project has been created',
        },
      ],
    });
  }

  console.log('Created notifications');

  // Create automation rules
  await prisma.automationRule.createMany({
    data: [
      {
        name: 'Auto-generate recommendations',
        description: 'Generate recommendations when project is created',
        trigger: { event: 'PROJECT_CREATED' },
        conditions: {},
        enabled: true,
      },
      {
        name: 'Calculate risk scores',
        description: 'Calculate risk scores when project status changes',
        trigger: { event: 'PROJECT_STATUS_CHANGED' },
        conditions: {},
        enabled: true,
      },
    ],
  });

  console.log('Created automation rules');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



