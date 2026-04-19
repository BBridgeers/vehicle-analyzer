/**
 * In-memory rate limiter for beta protection.
 * Resets on server restart / redeploy.
 * Migrate to Upstash Redis for production persistence.
 *
 * Limits:
 *   - 20 AI extractions per IP per hour
 *   - 100 VERA chat messages per IP per day
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check and increment rate limit.
 * Returns { allowed, remaining, resetAt }
 */
export function rateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
        // Fresh window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
    }

    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
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

// Convenience wrappers for specific routes
export const EXTRACT_LIMIT = { max: 20, windowMs: 60 * 60 * 1000 };       // 20/hr
export const CHAT_LIMIT    = { max: 100, windowMs: 24 * 60 * 60 * 1000 }; // 100/day
