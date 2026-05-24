import { kv } from './kv';
import { userKv } from './kv-user-wrapper';

/**
 * Persistent rate limiter using Vercel KV (Redis).
 * Multi-tenant version with per-user limits.
 * 
 * Limits:
 *   - 20 AI extractions per user per hour
 *   - 100 VERA chat messages per user per day
 */

const RATELIMIT_USER_PREFIX = (userId: string) => `${userId}:ratelimit:`;

/**
 * Check and increment rate limit using Redis.
 * Returns { allowed, remaining, resetAt }
 */
export async function rateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
    userId: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const prefixedKey = `${RATELIMIT_USER_PREFIX(userId)}${key}`;
    
    // Increment the counter for this user+endpoint key
    const count = await kv.incr(prefixedKey);
    
    // If it's a new key, set the expiration
    if (count === 1) {
        await kv.expire(prefixedKey, windowSeconds);
    }

    const resetAt = now + (await kv.ttl(prefixedKey)) * 1000;

    if (count > maxRequests) {
        return { 
            allowed: false, 
            remaining: 0, 
            resetAt 
        };
    }

    return { 
        allowed: true, 
        remaining: maxRequests - count, 
        resetAt 
    };
}

/**
 * Get client IP from Next.js request headers.
/** Get client IP from Next.js request headers (legacy, kept for backward compat). */
export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

// Deprecated: user-based rate limits now use userId from auth/session
export async function rateLimitByUser(
    endpoint: string,
    maxRequests: number,
    windowSeconds: number,
    userId: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    return rateLimit(endpoint, maxRequests, windowSeconds, userId);
}

// Convenience wrappers (Seconds for Redis EXPIRE)
export const EXTRACT_LIMIT = { max: 20, windowSec: 3600 };       // 20/hr
export const CHAT_LIMIT    = { max: 100, windowSec: 86400 };     // 100/day
