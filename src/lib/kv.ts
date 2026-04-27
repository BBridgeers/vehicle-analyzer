/**
 * Shared Vercel KV (Redis) client.
 * Uses standard Vercel KV environment variables.
 */
export const kv = Redis.fromEnv()
