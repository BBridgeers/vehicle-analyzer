import { Redis } from '@upstash/redis'

/**
 * Shared Vercel KV (Redis) client.
 * Uses environment variables:
 * - KV_REST_API_URL
 * - KV_REST_API_TOKEN
 */
export const kv = Redis.fromEnv()
