import 'dotenv/config';
import postgres from 'postgres';
import { S3Client, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  // Parse db url to get target db name & postgres maintenance db url
  const urlObj = new URL(dbUrl);
  const targetDbName = urlObj.pathname.replace(/^\//, '');
  
  console.log(`[Init] Target DB: ${targetDbName}`);
  console.log(`[Init] Connecting to PostgreSQL server...`);

  // Connect to default 'postgres' database to check/create the target DB
  urlObj.pathname = '/postgres';
  const adminClient = postgres(urlObj.toString(), { max: 1 });

  try {
    const existing = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${targetDbName}
    `;

    if (existing.length === 0) {
      console.log(`[Init] Database "${targetDbName}" belum ada. Membuat database...`);
      // CREATE DATABASE cannot be run in a transaction or parameterized via $1
      await adminClient.unsafe(`CREATE DATABASE "${targetDbName}"`);
      console.log(`[Init] Database "${targetDbName}" BERHASIL DIBUAT!`);
    } else {
      console.log(`[Init] Database "${targetDbName}" SUDAH ADA.`);
    }
  } catch (err) {
    console.error('[Init] Error saat inisialisasi Postgres:', err);
  } finally {
    await adminClient.end();
  }

  // 2. Initialize S3 Bucket on RustFS
  console.log(`\n[Init] Menghubungi RustFS di ${process.env.S3_ENDPOINT}...`);
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || ''
    }
  });

  const bucketName = process.env.S3_BUCKET || 'realmshaper-pgc';
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`[Init] Bucket "${bucketName}" SUDAH ADA di RustFS.`);
  } catch (err: any) {
    console.log(`[Init] Bucket "${bucketName}" belum ada. Membuat bucket...`);
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`[Init] Bucket "${bucketName}" BERHASIL DIBUAT di RustFS!`);
    } catch (createErr) {
      console.error('[Init] Gagal membuat bucket di RustFS:', createErr);
    }
  }
}

main().catch(console.error);

