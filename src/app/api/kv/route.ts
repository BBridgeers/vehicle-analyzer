import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

// ── Whitelisted keys for localStorage → Redis migration ─────────────────
// Keys not in this list are rejected (security: prevents arbitrary Redis access)
const ALLOWED_KEYS = [
  'activeVehicle',
  'activeAnalysis',
  'alertTriggers',
  'vera_comparison_ids',
  'vehicle-analyzer-chat',
  'vehicle-analyzer-history',
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

function isAllowed(key: string): key is AllowedKey {
  return ALLOWED_KEYS.includes(key as AllowedKey);
}

// ── GET /api/kv?key=vehicle-analyzer-history ─────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key || !isAllowed(key)) {
    return NextResponse.json(
      { error: `Invalid or missing key. Allowed: ${ALLOWED_KEYS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const value = await kv.get<string>(key);
    // Redis returns null for missing keys — return null (client handles defaults)
    return NextResponse.json({ key, value: value ?? null });
  } catch (e: any) {
    console.error(`[KV GET] ${key}:`, e.message);
    return NextResponse.json(
      { error: 'KV read failed', detail: e.message },
      { status: 500 }
    );
  }
}

// ── POST /api/kv { key, value } ──────────────────────────────────────────
export async function POST(request: Request) {
  let key: string;
  let value: unknown;

  try {
    const body = await request.json();
    key = body.key;
    value = body.value;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body. Expected { key, value }' },
      { status: 400 }
    );
  }

  if (!key || !isAllowed(key)) {
    return NextResponse.json(
      { error: `Invalid or missing key. Allowed: ${ALLOWED_KEYS.join(', ')}` },
      { status: 400 }
    );
  }

  if (value === undefined || value === null) {
    // Treat null/undefined as delete
    try {
      await kv.del(key);
      return NextResponse.json({ key, action: 'deleted' });
    } catch (e: any) {
      return NextResponse.json(
        { error: 'KV delete failed', detail: e.message },
        { status: 500 }
      );
    }
  }

  try {
    const serialized = JSON.stringify(value);
    // 7-day TTL for activeVehicle/activeAnalysis, 30-day for history/chat
    const ttl =
      key === 'activeVehicle' || key === 'activeAnalysis' ? 604800 : 2592000;

    await kv.set(key, serialized, { ex: ttl });
    return NextResponse.json({ key, action: 'saved', ttl });
  } catch (e: any) {
    console.error(`[KV POST] ${key}:`, e.message);
    return NextResponse.json(
      { error: 'KV write failed', detail: e.message },
      { status: 500 }
    );
  }
}

// ── DELETE /api/kv?key=... ───────────────────────────────────────────────
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key || !isAllowed(key)) {
    return NextResponse.json(
      { error: `Invalid or missing key. Allowed: ${ALLOWED_KEYS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    await kv.del(key);
    return NextResponse.json({ key, action: 'deleted' });
  } catch (e: any) {
    console.error(`[KV DELETE] ${key}:`, e.message);
    return NextResponse.json(
      { error: 'KV delete failed', detail: e.message },
      { status: 500 }
    );
  }
}
