import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global middleware: baseline security headers on every response.
 * (No auth gate — Veracar is a single-operator tool; rate limiting lives per-route.)
 */
export function middleware(req: NextRequest) {
    const res = NextResponse.next();
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.headers.set('X-DNS-Prefetch-Control', 'off');
    res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    return res;
}

export const config = {
    matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
