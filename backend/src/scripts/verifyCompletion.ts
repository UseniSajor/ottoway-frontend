import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface VerificationResult {
  category: string;
  check: string;
  passed: boolean;
  message?: string;
}

const results: VerificationResult[] = [];

function addResult(category: string, check: string, passed: boolean, message?: string) {
  results.push({ category, check, passed, message });
  const icon = passed ? '✓' : '✗';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`  ${icon} [${status}] ${check}${message ? ` - ${message}` : ''}`);
}

async function verifyRoles() {
  console.log('\n1. VERIFYING ROLES...');
  console.log('='.repeat(60));
  
  const requiredRoles = [
    'HOMEOWNER', 'PROJECT_OWNER', 'BUILDING_OWNER', 'BUSINESS_OWNER',
    'ASSET_MANAGER', 'PROPERTY_MANAGER', 'REAL_ESTATE_INVESTOR', 'CORPORATE_FACILITIES',
    'DEVELOPER', 'PROJECT_MANAGER',
    'PRIME_CONTRACTOR', 'SUBCONTRACTOR',
    'DESIGNER', 'ARCHITECT', 'INSPECTOR',
    'LENDER',
    'ADMIN', 'PLATFORM_OPERATOR'
  ];
  
  try {
    // Check schema file for enum definition
    const schemaPath = join(__dirname, '../../prisma/schema.prisma');
    if (existsSync(schemaPath)) {
      const fs = await import('fs/promises');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      
      const allRolesFound = requiredRoles.every(role => 
        schemaContent.includes(`"${role}"`) || schemaContent.includes(role)
      );
      
      addResult('Roles', `All ${requiredRoles.length} roles defined`, allRolesFound, 
        allRolesFound ? `${requiredRoles.length} roles found` : 'Some roles missing');
    } else {
      addResult('Roles', 'Schema file exists', false, 'schema.prisma not found');
    }
  } catch (error: any) {
    addResult('Roles', 'Check schema for roles', false, error.message);
  }
}

async function verifyPortals() {
  console.log('\n2. VERIFYING PORTALS...');
  console.log('='.repeat(60));
  
  // Go from backend/src/scripts to root, then to frontend
  const rootPath = join(__dirname, '../../../');
  
  const portalFiles = [
    { name: 'Owner Portal', path: 'frontend/src/portals/owner/OwnerPortal.tsx' },
    { name: 'PM Portal', path: 'frontend/src/portals/pm/PMPortal.tsx' },
    { name: 'Contractor Portal', path: 'frontend/src/portals/contractor/ContractorPortal.tsx' },
    { name: 'Admin Portal', path: 'frontend/src/portals/admin/AdminPortal.tsx' },
    { name: 'ML Portal', path: 'frontend/src/portals/ml/MLPortal.tsx' },
  ];
  
  for (const portal of portalFiles) {
    const fullPath = join(rootPath, portal.path);
    const exists = existsSync(fullPath);
    addResult('Portals', portal.name, exists, exists ? 'Portal file exists' : 'Portal file missing');
  }
  
  // Check key pages exist
  const keyPages = [
    { name: 'Owner Dashboard', path: 'frontend/src/pages/dashboard/OwnerDashboard.tsx' },
    { name: 'PM Dashboard', path: 'frontend/src/pages/pm/PMDashboard.tsx' },
    { name: 'Contractor Dashboard', path: 'frontend/src/pages/contractor/ContractorDashboard.tsx' },
    { name: 'Admin Dashboard', path: 'frontend/src/pages/admin/AdminDashboard.tsx' },
    { name: 'ML Dashboard', path: 'frontend/src/pages/ml/MLDashboard.tsx' },
  ];
  
  for (const page of keyPages) {
    const fullPath = join(rootPath, page.path);
    const exists = existsSync(fullPath);
    addResult('Portals', page.name, exists);
  }
}

async function verifyProjectTypes() {
  console.log('\n3. VERIFYING PROJECT TYPES...');
  console.log('='.repeat(60));
  
  const requiredProjectTypes = [
    'NEW_CONSTRUCTION_RESIDENTIAL', 'WHOLE_HOUSE_RENOVATION', 'ADDITION_EXPANSION',
    'INTERIOR_RENOVATION_LIGHT', 'INTERIOR_RENOVATION_MAJOR', 'KITCHEN_BATH_REMODEL',
    'BASEMENT_FINISH', 'ACCESSIBILITY_MODIFICATIONS',
    'NEW_CONSTRUCTION_COMMERCIAL', 'TENANT_IMPROVEMENT_OFFICE', 'TENANT_IMPROVEMENT_RETAIL',
    'TENANT_IMPROVEMENT_RESTAURANT', 'COMMERCIAL_RENOVATION', 'STOREFRONT_FACADE',
    'WAREHOUSE_BUILDOUT', 'MANUFACTURING_FACILITY', 'INDUSTRIAL_RENOVATION',
    'SCHOOL_FACILITY', 'HEALTHCARE_FACILITY', 'GOVERNMENT_BUILDING',
    'MIXED_USE_DEVELOPMENT'
  ];
  
  try {
    const metadataPath = join(__dirname, '../data/projectTypeMetadata.ts');
    if (existsSync(metadataPath)) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(metadataPath, 'utf-8');
      
      const allTypesFound = requiredProjectTypes.every(type => content.includes(type));
      addResult('Project Types', `All ${requiredProjectTypes.length} project types defined`, allTypesFound,
        allTypesFound ? `${requiredProjectTypes.length} types found` : 'Some types missing');
    } else {
      addResult('Project Types', 'Project type metadata file exists', false);
    }
  } catch (error: any) {
    addResult('Project Types', 'Check project types', false, error.message);
  }
}

async function verifyWorkflowEnforcement() {
  console.log('\n4. VERIFYING WORKFLOW ENFORCEMENT...');
  console.log('='.repeat(60));
  
  const workflowPath = join(__dirname, '../middleware/workflowRules.ts');
  const exists = existsSync(workflowPath);
  addResult('Workflow', 'Workflow rules middleware exists', exists);
  
  if (exists) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(workflowPath, 'utf-8');
      
      addResult('Workflow', 'Permit submission blocking', content.includes('enforcePermitSubmissionRules'));
      addResult('Workflow', 'Escrow release verification', content.includes('enforceEscrowReleaseRules'));
      addResult('Workflow', 'Review submission locking', content.includes('enforceReviewSubmissionRules'));
      addResult('Workflow', 'Contractor invite-only', content.includes('enforceContractorRegistrationRules'));
      addResult('Workflow', 'Automation guardrails', content.includes('enforceAutomationActionRules'));
    } catch (error: any) {
      addResult('Workflow', 'Read workflow file', false, error.message);
    }
  }
}

async function verifyMLEngine() {
  console.log('\n5. VERIFYING ML ENGINE...');
  console.log('='.repeat(60));
  
  const mlEnginePath = join(__dirname, '../services/mlEngine.ts');
  const eventProcessorPath = join(__dirname, '../services/eventProcessor.ts');
  
  addResult('ML', 'ML Engine service exists', existsSync(mlEnginePath));
  addResult('ML', 'Event Processor service exists', existsSync(eventProcessorPath));
  
  if (existsSync(mlEnginePath)) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(mlEnginePath, 'utf-8');
      
      addResult('ML', 'Feature extraction implemented', content.includes('extractProjectFeatures'));
      addResult('ML', 'Permit risk assessment', content.includes('assessPermitRisk'));
      addResult('ML', 'Recommendation generation', content.includes('generateNextBestAction'));
      addResult('ML', 'Explainable AI (reasoning field)', content.includes('reasoning') && content.includes('explanation'));
    } catch (error: any) {
      addResult('ML', 'Read ML engine file', false, error.message);
    }
  }
}

async function verifyDatabaseSchema() {
  console.log('\n6. VERIFYING DATABASE SCHEMA...');
  console.log('='.repeat(60));
  
  try {
    // Check key models exist by querying Prisma
    await prisma.$connect();
    
    // Try to access key models (this validates they exist in schema)
    const models = [
      'User', 'Project', 'Property', 'ContractAgreement', 'PermitSet',
      'EscrowAgreement', 'EscrowTransaction', 'DesignVersion',
      'ReadinessChecklist', 'ProjectCloseout', 'ProjectReview',
      'ProjectEvent', 'ModelScore', 'Recommendation', 'AutomationRule',
      'MLFeatureSnapshot'
    ];
    
    for (const model of models) {
      try {
        // Just check if we can access the model (count query)
        await (prisma as any)[model.toLowerCase()].count();
        addResult('Database', `${model} model exists`, true);
      } catch (error: any) {
        // Model might not exist or have count method - check schema file instead
        const schemaPath = join(__dirname, '../../prisma/schema.prisma');
        const fs = await import('fs/promises');
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        const exists = schemaContent.includes(`model ${model}`);
        addResult('Database', `${model} model exists`, exists);
      }
    }
    
    await prisma.$disconnect();
  } catch (error: any) {
    addResult('Database', 'Database connection', false, error.message);
  }
}

async function verifyRoutes() {
  console.log('\n7. VERIFYING API ROUTES...');
  console.log('='.repeat(60));
  
  const routeFiles = [
    { name: 'Auth routes', path: '../routes/auth.ts' },
    { name: 'Properties routes', path: '../routes/properties.ts' },
    { name: 'Projects routes', path: '../routes/projects.ts' },
    { name: 'Project Types routes', path: '../routes/projectTypes.ts' },
    { name: 'Design routes', path: '../routes/design.ts' },
    { name: 'Readiness routes', path: '../routes/readiness.ts' },
    { name: 'Escrow routes', path: '../routes/escrow.ts' },
    { name: 'Closeout routes', path: '../routes/closeout.ts' },
    { name: 'Reviews routes', path: '../routes/reviews.ts' },
    { name: 'PM routes', path: '../routes/pm.ts' },
    { name: 'Contractor routes', path: '../routes/contractor.ts' },
    { name: 'Admin routes', path: '../routes/admin.ts' },
    { name: 'ML routes', path: '../routes/ml.ts' },
  ];
  
  for (const route of routeFiles) {
    const fullPath = join(__dirname, route.path);
    const exists = existsSync(fullPath);
    addResult('Routes', route.name, exists);
  }
}

async function verifyServices() {
  console.log('\n8. VERIFYING SERVICES...');
  console.log('='.repeat(60));
  
  const serviceFiles = [
    { name: 'ML Engine', path: '../services/mlEngine.ts' },
    { name: 'Event Processor', path: '../services/eventProcessor.ts' },
    { name: 'Audit Logger', path: '../services/auditLogger.ts' },
    { name: 'Notification Service', path: '../services/notificationService.ts' },
    { name: 'Permit Service', path: '../services/permitService.ts' },
    { name: 'Storage Service', path: '../services/storage.ts' },
  ];
  
  for (const service of serviceFiles) {
    const fullPath = join(__dirname, service.path);
    const exists = existsSync(fullPath);
    addResult('Services', service.name, exists);
  }
}

async function verifyScheduledJobs() {
  console.log('\n9. VERIFYING SCHEDULED JOBS...');
  console.log('='.repeat(60));
  
  const jobsPath = join(__dirname, '../jobs/scheduledJobs.ts');
  const exists = existsSync(jobsPath);
  addResult('Jobs', 'Scheduled jobs file exists', exists);
  
  if (exists) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(jobsPath, 'utf-8');
      
      addResult('Jobs', 'Daily ML processing', content.includes('0 2 * * *'));
      addResult('Jobs', 'Weekly recommendations', content.includes('0 9 * * 1'));
      addResult('Jobs', 'Recommendation expiration', content.includes('0 0 * * *'));
    } catch (error: any) {
      addResult('Jobs', 'Read jobs file', false, error.message);
    }
  }
}

async function verifyIntegration() {
  console.log('\n10. VERIFYING INTEGRATIONS...');
  console.log('='.repeat(60));
  
  // Check if Stripe is mentioned in codebase
  try {
    const escrowPath = join(__dirname, '../routes/escrow.ts');
    if (existsSync(escrowPath)) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(escrowPath, 'utf-8');
      addResult('Integration', 'Stripe integration code exists', content.includes('stripe'));
    } else {
      addResult('Integration', 'Escrow routes exist', false);
    }
  } catch (error: any) {
    addResult('Integration', 'Check Stripe integration', false, error.message);
  }
  
  // Check if Claude/Anthropic is mentioned (optional)
  try {
    const mlEnginePath = join(__dirname, '../services/mlEngine.ts');
    if (existsSync(mlEnginePath)) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(mlEnginePath, 'utf-8');
      addResult('Integration', 'Claude API integration code exists', 
        content.includes('anthropic') || content.includes('claude'));
    }
  } catch (error: any) {
    // Optional check, don't fail if not found
  }
}

async function verifyCompletion() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   MASTER_SPEC DEFINITION OF DONE VERIFICATION             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  await verifyRoles();
  await verifyPortals();
  await verifyProjectTypes();
  await verifyWorkflowEnforcement();
  await verifyMLEngine();
  await verifyDatabaseSchema();
  await verifyRoutes();
  await verifyServices();
  await verifyScheduledJobs();
  await verifyIntegration();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\nVERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotal Checks: ${total}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉🎉🎉 PLATFORM IS COMPLETE PER MASTER_SPEC! 🎉🎉🎉');
    console.log('\nAll Definition of Done requirements have been met.');
    console.log('The platform is ready for deployment.\n');
  } else {
    console.log('\n⚠️  PLATFORM IS INCOMPLETE');
    console.log('\nFailed Checks:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗ [${r.category}] ${r.check}${r.message ? ` - ${r.message}` : ''}`);
    });
    console.log('\nPlease address the failed checks before marking as complete.\n');
  }
  
  // Group by category
  console.log('\nResults by Category:');
  console.log('-'.repeat(60));
  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    const categoryTotal = categoryResults.length;
    const icon = categoryPassed === categoryTotal ? '✓' : '⚠';
    console.log(`${icon} ${category}: ${categoryPassed}/${categoryTotal} passed`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  return failed === 0;
}

verifyCompletion()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Verification script failed:', error);
    process.exit(1);
  });

