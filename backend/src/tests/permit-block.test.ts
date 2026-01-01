import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = express();
// TODO: Import your actual app setup

const prisma = new PrismaClient();

describe('Permit Blocking Tests', () => {
  let userToken: string;
  let projectId: string;
  let propertyId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('test123', 10);

    const user = await prisma.user.create({
      data: {
        email: 'test-user@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        role: 'HOMEOWNER',
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-user@test.com', password: 'test123' });
    userToken = loginRes.body.data.token;

    const property = await prisma.property.create({
      data: {
        ownerId: user.id,
        propertyType: 'Test Property',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
      },
    });
    propertyId = property.id;

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
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.user.deleteMany({ where: { email: 'test-user@test.com' } });
    await prisma.$disconnect();
  });

  it('should block permit submission without contract', async () => {
    const res = await request(app)
      .post(`/api/permits/projects/${projectId}/permits/submit`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.blockingReasons).toBeDefined();
    expect(res.body.blockingReasons.some((r: any) => r.type === 'CONTRACT_NOT_SIGNED')).toBe(true);
  });

  it('should block permit submission without approved design', async () => {
    // Create contract but no design
    await prisma.contractAgreement.create({
      data: {
        projectId,
        status: 'FULLY_SIGNED',
      },
    });

    const res = await request(app)
      .post(`/api/permits/projects/${projectId}/permits/submit`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.blockingReasons).toBeDefined();
    expect(res.body.blockingReasons.some((r: any) => r.type === 'DESIGN_NOT_APPROVED')).toBe(true);
  });

  it('should block permit submission without completed readiness', async () => {
    // Create design
    await prisma.designVersion.create({
      data: {
        projectId,
        version: 1,
        status: 'APPROVED_FOR_PERMIT',
      },
    });

    // Create readiness with incomplete items
    const checklist = await prisma.readinessChecklist.create({
      data: { projectId },
    });

    await prisma.readinessItem.create({
      data: {
        checklistId: checklist.id,
        title: 'Test Item',
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .post(`/api/permits/projects/${projectId}/permits/submit`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.blockingReasons).toBeDefined();
    expect(res.body.blockingReasons.some((r: any) => r.type === 'READINESS_INCOMPLETE')).toBe(true);
  });

  it('should allow permit submission when all conditions met', async () => {
    // Complete readiness item
    const checklist = await prisma.readinessChecklist.findFirst({
      where: { projectId },
      include: { items: true },
    });

    if (checklist && checklist.items.length > 0) {
      await prisma.readinessItem.update({
        where: { id: checklist.items[0].id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    const res = await request(app)
      .post(`/api/permits/projects/${projectId}/permits/submit`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('SUBMITTED');
  });
});



