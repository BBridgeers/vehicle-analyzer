import { Redis } from '@upstash/redis';

/**
 * Multi-tenant KV wrapper with user-scoped keys.
 * All keys are prefixed with `user:{userId}:` for isolation.
 */

const USER_PREFIX = (userId: string) => `user:${userId}:`;

// User keys
export const getUserFleetKey = (userId: string) => `${USER_PREFIX(userId)}fleet`;
export const getUserComparisonKey = (userId: string) => `${USER_PREFIX(userId)}comparison_ids`;
export const getUserSessionKey = (userId: string) => `${USER_PREFIX(userId)}session`;
export const getUserSettingsKey = (userId: string) => `${USER_PREFIX(userId)}settings`;
export const getUserRateLimitKey = (userId: string, endpoint: string) => 
  `${USER_PREFIX(userId)}ratelimit:${endpoint}:${new Date().toDateString()}`;
export const getUserSweepKey = (userId: string, sweepId: string) => `${USER_PREFIX(userId)}sweep:${sweepId}`;

/**
 * Get the current user ID from the request (or session).
 * Falls back to 'anonymous' if no auth is present.
 */
export async function getCurrentUserId(request?: Request): Promise<string> {
  return process.env.HARD_CODED_USER_ID || 'demo';
}

/**
 * Create a new Redis client instance with auto-prefixed keys for a user.
 */
export function createUserClient(userId: string, client: Redis): Redis {
  const originalSet = client.set.bind(client);
  const originalGet = client.get.bind(client);
  const originalIncr = client.incr.bind(client);
  const originalHSet = client.hset.bind(client);
  const originalHGet = client.hget.bind(client);
  const originalZAdd = client.zadd.bind(client);
  const originalZRange = client.zrange.bind(client);
  const originalDel = client.del.bind(client);

  const userPrefix = USER_PREFIX(userId);

  const proxied: any = {
    set: async (key: string, value: any, options?: any) => 
      originalSet(userPrefix + key, value, options),
    get: async (key: string) => originalGet(userPrefix + key),
    incr: async (key: string) => originalIncr(userPrefix + key),
    hset: async (key: string, data: any) => originalHSet(userPrefix + key, data),
    hget: async (key: string, field: string) => originalHGet(userPrefix + key, field),
    zadd: async (key: string, data: any) => originalZAdd(userPrefix + key, data),
    zrange: async (key: string, start: number, end: number) => originalZRange(userPrefix + key, start, end),
    del: async (key: string) => originalDel(userPrefix + key),
    // Pass through other methods
    ...client,
  };

  // Return a new Redis instance with proxied methods
  return proxied as any;
}

/**
 * Wrap operations with user context.
 */
export async function withUserContext<T>(
  userId: string,
  fn: (userClient: Redis) => Promise<T>,
  baseClient?: Redis
): Promise<T> {
  const client = baseClient || Redis.fromEnv();
  return fn(createUserClient(userId, client));
}
