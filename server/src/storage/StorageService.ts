import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

export type PgcKind = 'texture' | 'map' | 'weapon' | 'armor' | 'monster';

/** Whitelist content-type & batas ukuran per jenis asset PGC. */
const UPLOAD_RULES: Record<PgcKind, { types: string[]; maxBytes: number }> = {
  texture: { types: ['image/png', 'image/webp'], maxBytes: 2 * 1024 * 1024 },
  map: { types: ['application/json'], maxBytes: 1 * 1024 * 1024 },
  weapon: { types: ['application/json', 'image/png'], maxBytes: 1 * 1024 * 1024 },
  armor: { types: ['application/json', 'image/png'], maxBytes: 1 * 1024 * 1024 },
  monster: { types: ['application/json'], maxBytes: 512 * 1024 }
};

export class StorageError extends Error {}

/**
 * Wrapper RustFS (S3-compatible). Satu bucket private dengan prefix `pending/` & `approved/`.
 */
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string = env.S3_BUCKET;

  constructor() {
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
    });
  }

  public async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      console.log(`[Storage] Bucket created: ${this.bucket}`);
    }
  }

  public async ping(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  public validateUpload(kind: PgcKind, contentType: string, sizeBytes: number): void {
    const rule = UPLOAD_RULES[kind];
    if (!rule.types.includes(contentType)) throw new StorageError(`content_type not allowed for ${kind}`);
    if (sizeBytes <= 0 || sizeBytes > rule.maxBytes) throw new StorageError(`size exceeds limit (${rule.maxBytes})`);
  }

  public pendingKey(kind: PgcKind, assetId: string): string {
    return `pending/${kind}/${assetId}`;
  }

  public async createUploadUrl(key: string, contentType: string, sizeBytes: number): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes
    });
    return getSignedUrl(this.client, cmd, { expiresIn: env.S3_PRESIGN_TTL_SEC });
  }

  /** Memastikan objek benar-benar ada dan sesuai metadata yang dideklarasikan. */
  public async verifyUpload(key: string, contentType: string, sizeBytes: number): Promise<boolean> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return head.ContentLength === sizeBytes && head.ContentType === contentType;
    } catch {
      return false;
    }
  }

  /** Pindahkan objek dari pending/ ke approved/ (dipakai pipeline moderasi). */
  public async promote(pendingKey: string): Promise<string> {
    const approvedKey = pendingKey.replace(/^pending\//, 'approved/');
    await this.client.send(
      new CopyObjectCommand({ Bucket: this.bucket, Key: approvedKey, CopySource: `${this.bucket}/${pendingKey}` })
    );
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: pendingKey }));
    return approvedKey;
  }

  public async createDownloadUrl(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: env.S3_PRESIGN_TTL_SEC
    });
  }
}

