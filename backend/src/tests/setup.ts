// Test setup file
// This file is run before all tests

import { PrismaClient } from '@prisma/client';

// Create a test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// Cleanup after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
});



