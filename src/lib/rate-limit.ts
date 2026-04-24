import { kv } from './kv';

/**
 * Persistent rate limiter using Vercel KV (Redis).
 * 
 * Limits:
 *   - 20 AI extractions per IP per hour
 *   - 100 VERA chat messages per IP per day
 */

/**
 * Check and increment rate limit using Redis.
 * Returns { allowed, remaining, resetAt }
 */
export async function rateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    // Increment the counter for this key
    const count = await kv.incr(key);
    
    // If it's a new key, set the expiration
    if (count === 1) {
        await kv.expire(key, windowSeconds);
    }

    const resetAt = now + (await kv.ttl(key)) * 1000;

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
 */
export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

// Convenience wrappers (Seconds for Redis EXPIRE)
export const EXTRACT_LIMIT = { max: 20, windowSec: 3600 };       // 20/hr
export const CHAT_LIMIT    = { max: 100, windowSec: 86400 };     // 100/day
