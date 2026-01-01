import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = express();
// TODO: Import your actual app setup

const prisma = new PrismaClient();

describe('Escrow Approval Tests', () => {
  let userToken: string;
  let projectId: string;
  let escrowId: string;
  let milestoneId: string;
  let transactionId: string;

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

    const escrow = await prisma.escrowAgreement.create({
      data: {
        projectId,
        amount: 100000,
        status: 'FUNDED',
      },
    });
    escrowId = escrow.id;

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        escrowId,
        name: 'Test Milestone',
        amount: 50000,
        status: 'COMPLETED',
      },
    });
    milestoneId = milestone.id;

    const verificationItem = await prisma.verificationItem.create({
      data: {
        milestoneId,
        type: 'RECEIPT',
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    await prisma.receipt.create({
      data: {
        verificationId: verificationItem.id,
        amount: 50000,
        fileUrl: 'https://example.com/receipt.pdf',
      },
    });
  });

  afterAll(async () => {
    await prisma.escrowTransaction.deleteMany({ where: { id: transactionId } });
    await prisma.milestone.deleteMany({ where: { id: milestoneId } });
    await prisma.escrowAgreement.deleteMany({ where: { id: escrowId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.property.deleteMany({ where: { projectId } });
    await prisma.user.deleteMany({ where: { email: 'test-user@test.com' } });
    await prisma.$disconnect();
  });

  it('should block escrow release approval without human confirmation flag', async () => {
    // Request release first
    const requestRes = await request(app)
      .post(`/api/escrow/${escrowId}/release-request`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ milestoneId });

    transactionId = requestRes.body.data.id;

    // Try to approve without human confirmation
    const res = await request(app)
      .post(`/api/escrow/transactions/${transactionId}/approve`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('ESCROW_RELEASE_REQUIRES_HUMAN_APPROVAL');
  });

  it('should allow escrow release approval with human confirmation flag', async () => {
    const res = await request(app)
      .post(`/api/escrow/transactions/${transactionId}/approve`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ requiresHumanConfirmation: true });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('should block escrow release if dispute exists', async () => {
    // Create dispute
    await prisma.dispute.create({
      data: {
        projectId,
        title: 'Test Dispute',
        description: 'Test dispute description',
        status: 'OPEN',
      },
    });

    // Create new transaction
    const newTransaction = await prisma.escrowTransaction.create({
      data: {
        escrowId,
        type: 'RELEASE',
        amount: 25000,
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .post(`/api/escrow/${escrowId}/release-request`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ milestoneId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('RELEASE_BLOCKED');
    expect(res.body.message).toContain('dispute');
  });
});



