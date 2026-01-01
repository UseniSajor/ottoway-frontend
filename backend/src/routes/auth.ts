import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    logger.info('Registration attempt started', { email: req.body?.email });
    
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      logger.warn('Registration attempt with missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError) {
      logger.error('Database query failed when checking existing user', { error: dbError });
      return res.status(500).json({ 
        message: 'Database error',
        details: env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    if (existingUser) {
      logger.warn('Registration attempt failed: User already exists', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (bcryptError) {
      logger.error('Password hashing failed', { error: bcryptError });
      return res.status(500).json({ 
        message: 'Password hashing error',
        details: env.NODE_ENV === 'development' ? (bcryptError instanceof Error ? bcryptError.message : String(bcryptError)) : undefined
      });
    }

    // Create user
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash, // Maps to passwordHash column
          firstName,
          lastName,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      logger.error('Database query failed when creating user', { error: dbError });
      return res.status(500).json({ 
        message: 'Database error',
        details: env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    // Generate token
    let token: string;
    try {
      token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
    } catch (jwtError) {
      logger.error('JWT token generation failed', { error: jwtError });
      return res.status(500).json({ 
        message: 'Token generation error',
        details: env.NODE_ENV === 'development' ? (jwtError instanceof Error ? jwtError.message : String(jwtError)) : undefined
      });
    }

    logger.info('Registration successful', { userId: user.id, email: user.email });

    res.status(201).json({
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Registration error - unexpected exception', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Registration failed',
      details: env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    logger.info('Login attempt started', { email: req.body?.email });
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check JWT_SECRET is properly configured
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      logger.error('JWT_SECRET is not properly configured', { 
        hasSecret: !!JWT_SECRET, 
        length: JWT_SECRET?.length 
      });
      return res.status(500).json({ 
        message: 'Server configuration error',
        details: env.NODE_ENV === 'development' ? 'JWT_SECRET is missing or too short' : undefined
      });
    }

    // Test database connection
    try {
      await prisma.$connect();
      logger.debug('Database connection verified');
    } catch (dbError) {
      logger.error('Database connection failed', { error: dbError });
      return res.status(500).json({ 
        message: 'Database connection error',
        details: env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    // Find user
    let user;
    try {
      logger.debug('Attempting to find user', { email: email.toLowerCase().trim() });
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      logger.debug('User lookup completed', { found: !!user, userId: user?.id });
    } catch (dbError) {
      logger.error('Database query failed when finding user', { 
        error: dbError,
        email: email.toLowerCase().trim()
      });
      return res.status(500).json({ 
        message: 'Database error',
        details: env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    if (!user) {
      logger.warn('Login attempt failed: User not found', { email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password hash exists
    if (!user.password) {
      logger.error('User has no password hash', { userId: user.id, email: user.email });
      return res.status(500).json({ 
        message: 'User account error',
        details: env.NODE_ENV === 'development' ? 'User account is missing password hash' : undefined
      });
    }

    // Verify password
    let isValid = false;
    try {
      logger.debug('Verifying password', { userId: user.id });
      isValid = await bcrypt.compare(password, user.password);
      logger.debug('Password verification completed', { isValid });
    } catch (bcryptError) {
      logger.error('Password comparison failed', { 
        error: bcryptError,
        userId: user.id
      });
      return res.status(500).json({ 
        message: 'Password verification error',
        details: env.NODE_ENV === 'development' ? (bcryptError instanceof Error ? bcryptError.message : String(bcryptError)) : undefined
      });
    }

    if (!isValid) {
      logger.warn('Login attempt failed: Invalid password', { email, userId: user.id });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    let token: string;
    try {
      logger.debug('Generating JWT token', { userId: user.id, email: user.email, role: user.role });
      token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      logger.debug('JWT token generated successfully');
    } catch (jwtError) {
      logger.error('JWT token generation failed', { 
        error: jwtError,
        userId: user.id
      });
      return res.status(500).json({ 
        message: 'Token generation error',
        details: env.NODE_ENV === 'development' ? (jwtError instanceof Error ? jwtError.message : String(jwtError)) : undefined
      });
    }

    logger.info('Login successful', { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Login error - unexpected exception', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({ 
      message: 'Login failed',
      details: env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error)) 
        : undefined
    });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      logger.warn('Get user request without authenticated user');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    logger.debug('Fetching user data', { userId: req.user.id });

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      logger.error('Database query failed when fetching user', { 
        error: dbError,
        userId: req.user.id
      });
      return res.status(500).json({ 
        message: 'Database error',
        details: env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    if (!user) {
      logger.warn('User not found in database', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    logger.error('Get user error - unexpected exception', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Failed to get user',
      details: env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export { router as authRouter };



