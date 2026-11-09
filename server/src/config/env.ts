import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().default(8080),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(3),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),
  S3_PRESIGN_TTL_SEC: z.coerce.number().int().positive().default(300),
  AUTOSAVE_INTERVAL_MS: z.coerce.number().int().positive().default(30000)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[Config] Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

