import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  ADMIN_RECOVERY_DIAGNOSTICS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  ADMIN_RECOVERY_DIAGNOSTICS_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);

if (env.NODE_ENV === 'production') {
  const clientOrigin = new URL(env.CLIENT_URL);
  if (
    clientOrigin.protocol !== 'https:' ||
    clientOrigin.origin !== env.CLIENT_URL ||
    ['localhost', '127.0.0.1'].includes(clientOrigin.hostname)
  ) {
    throw new Error('CLIENT_URL must be the exact HTTPS origin of the production website.');
  }
  if (!env.TRUST_PROXY) {
    throw new Error('TRUST_PROXY must be true when running behind the production proxy.');
  }
}
