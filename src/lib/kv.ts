import { Redis } from '@upstash/redis';

/**
 * Shared Vercel KV (Redis) client.
 * Uses standard Vercel KV environment variables.
 */
export const kv = Redis.fromEnv()
