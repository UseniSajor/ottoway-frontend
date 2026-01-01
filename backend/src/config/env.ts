/**
 * Strict environment variable validation
 * Fails fast on startup if required env vars are missing
 */
import "dotenv/config";

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: string;
  CORS_ORIGIN: string;
  NODE_ENV: 'development' | 'production' | 'test';
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  ANTHROPIC_API_KEY?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required in all environments
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (!process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN is required');
  }

  // Validate CORS_ORIGIN format
  if (process.env.CORS_ORIGIN) {
    try {
      new URL(process.env.CORS_ORIGIN);
    } catch {
      errors.push('CORS_ORIGIN must be a valid URL');
    }
  }

  // Required in production
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  if (nodeEnv === 'production') {
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY is required in production');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      errors.push('AWS credentials are required in production for file storage');
    }

    if (!process.env.AWS_S3_BUCKET) {
      errors.push('AWS_S3_BUCKET is required in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file or environment variables.');
    process.exit(1);
  }

  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    PORT: process.env.PORT || '5000',
    CORS_ORIGIN: process.env.CORS_ORIGIN!,
    NODE_ENV: nodeEnv,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  };

  console.log('✅ Environment validation passed');
  console.log(`   NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   CORS_ORIGIN: ${config.CORS_ORIGIN}`);
  console.log(`   PORT: ${config.PORT}`);

  return config;
}

// Lazy validation - only runs when accessed, not on import
let _env: EnvConfig | null = null;

function getEnv(): EnvConfig {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

export const env = new Proxy({} as EnvConfig, {
  get(target, prop) {
    return getEnv()[prop as keyof EnvConfig];
  }
});



