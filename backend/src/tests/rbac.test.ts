import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Import app setup
// TODO: Import your actual Express app
// For now, we'll need to set up the app in tests
let app: any;
const prisma = new PrismaClient();

// Note: These tests require the server to be running or a test app instance
// You may need to import and configure your Express app here

describe('RBAC Tests', () => {
  let homeownerToken: string;
  let pmToken: string;
  let contractorToken: string;
  let adminToken: string;
  let homeownerId: string;
  let projectId: string;

  beforeAll(async () => {
    // Create test users
    const passwordHash = await bcrypt.hash('test123', 10);

    const homeowner = await prisma.user.create({
      data: {
        email: 'test-homeowner@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'Homeowner',
        role: 'HOMEOWNER',
      },
    });
    homeownerId = homeowner.id;

    await prisma.user.create({
      data: {
        email: 'test-pm@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'PM',
        role: 'PROJECT_MANAGER',
      },
    });

    await prisma.user.create({
      data: {
        email: 'test-contractor@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'Contractor',
        role: 'PRIME_CONTRACTOR',
      },
    });

    await prisma.user.create({
      data: {
        email: 'test-admin@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    // Login to get tokens
    const homeownerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-homeowner@test.com', password: 'test123' });
    homeownerToken = homeownerRes.body.data.token;

    const pmRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-pm@test.com', password: 'test123' });
    pmToken = pmRes.body.data.token;

    const contractorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-contractor@test.com', password: 'test123' });
    contractorToken = contractorRes.body.data.token;

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-admin@test.com', password: 'test123' });
    adminToken = adminRes.body.data.token;

    // Create test project
    const property = await prisma.property.create({
      data: {
        ownerId: homeownerId,
        propertyType: 'Test Property',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
      },
    });

    const project = await prisma.project.create({
      data: {
        propertyId: property.id,
        name: 'Test Project',
        category: 'RESIDENTIAL',
        projectType: 'NEW_CONSTRUCTION_RESIDENTIAL',
        complexity: 'MODERATE',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.property.deleteMany({ where: { ownerId: homeownerId } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-homeowner@test.com',
            'test-pm@test.com',
            'test-contractor@test.com',
            'test-admin@test.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  it('should allow homeowner to access owner portal', async () => {
    const res = await request(app)
      .get('/api/properties')
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(200);
  });

  it('should allow PM to access PM portal', async () => {
    const res = await request(app)
      .get('/api/pm/readiness-queue')
      .set('Authorization', `Bearer ${pmToken}`);

    // Should not be 403 Forbidden
    expect(res.status).not.toBe(403);
  });

  it('should allow contractor to access contractor portal', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${contractorToken}`);

    expect(res.status).not.toBe(403);
  });

  it('should block non-admin from ML portal', async () => {
    const res = await request(app)
      .get('/api/automation/rules')
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to access ML portal', async () => {
    const res = await request(app)
      .get('/api/automation/rules')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('should block non-admin from contractor approvals', async () => {
    const res = await request(app)
      .get('/api/admin/contractors/applications')
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to access contractor approvals', async () => {
    const res = await request(app)
      .get('/api/admin/contractors/applications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

