import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { getCurrentUserId } from '@/lib/kv-multi-tenant';

/**
 * User authentication middleware - v2
 * Extracts user ID from session or header, falls back to 'demo' for single-user mode
 */

export async function verifyUser(request: NextRequest): Promise<{ userId: string; legal: boolean }> {
  // Check for hardcoded user (VPS local mode)
  const hardcoded = process.env.HARD_CODED_USER_ID;
  if (hardcoded) {
    return { userId: hardcoded, legal: true };
  }

  // Check Authorization header for API tokens
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // TODO: Validate token against JWT/user store
    if (token.length > 10) {  // Rough validation
      return { userId: token, legal: true };
    }
  }

  // Fall back to IP-based identification (shared environment)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 'unknown';
  return { userId: ip, legal: true };
}

export async function middleware(request: NextRequest): Promise<NextResponse | undefined> {
  const { userId, legal } = await verifyUser(request);

  if (!legal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Attach user context to request for downstream handlers
  // In Next.js middleware, we can only pass data via headers or cookies
  const response = NextResponse.next();
  response.headers.set('X-User-Id', userId);
  
  return response;
}
