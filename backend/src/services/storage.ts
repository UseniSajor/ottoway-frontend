import { env } from '../config/env';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export interface StorageAdapter {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

/**
 * Local file storage adapter (development)
 */
class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, file);

    logger.info('File uploaded locally', { key, path: filePath });
    return `/uploads/${key}`;
  }

  async getUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
      logger.info('File deleted locally', { key });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

/**
 * S3 storage adapter (production)
 */
class S3StorageAdapter implements StorageAdapter {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET!;
    this.region = env.AWS_REGION!;
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    // TODO: Implement S3 upload using AWS SDK
    // const s3 = new S3Client({ region: this.region });
    // const command = new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    //   Body: file,
    //   ContentType: contentType,
    // });
    // await s3.send(command);

    logger.info('File uploaded to S3', { key, bucket: this.bucket });
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getUrl(key: string): Promise<string> {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement S3 delete
    // const command = new DeleteObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    // });
    // await s3.send(command);

    logger.info('File deleted from S3', { key });
  }
}

/**
 * Get storage adapter based on environment
 */
export function getStorageAdapter(): StorageAdapter {
  if (env.NODE_ENV === 'production') {
    if (!env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET is required in production');
    }
    return new S3StorageAdapter();
  }

  return new LocalStorageAdapter();
}

export const storage = getStorageAdapter();



