import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting
 */
export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ipKey = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
    ? req.headers['x-forwarded-for'][0] 
    : req.headers['x-forwarded-for']) || 'unknown';
  const key = typeof ipKey === 'string' ? ipKey : ipKey[0] || 'unknown';
  const now = Date.now();

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    return next();
  }

  store[key].count++;

  if (store[key].count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
    });
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - store[key].count));
  res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

  next();
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, RATE_LIMIT_WINDOW_MS);



