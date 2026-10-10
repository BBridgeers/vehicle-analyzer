import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { TEXT_MODEL, VISION_MODEL } from '@/lib/llm-config';

export const dynamic = 'force-dynamic';

/**
 * Operational health probe: verifies the app, the local KV store and the
 * configured engines. Local-only (no external calls) so it stays fast.
 */
export async function GET() {
  const checks: Record<string, any> = {
    service: 'ok',
    ts: new Date().toISOString(),
    engines: {
      text: TEXT_MODEL,
      vision: VISION_MODEL,
      nvidia: !!process.env.NVIDIA_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
    },
  };

  try {
    const key = `health:${Date.now()}`;
    await kv.set(key, { ok: true }, { ex: 60 });
    const back = await kv.get(key);
    await kv.del(key);
    checks.kv = back ? 'ok' : 'degraded';
  } catch (e: any) {
    checks.kv = `error: ${e?.message || e}`;
  }

  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync('/var/lib/veracar/veracar.db');
    const row: any = db.prepare('SELECT count(*) c FROM kv').get();
    checks.kvRows = row?.c ?? null;
  } catch { checks.kvRows = null; }

  checks.ok = checks.kv === 'ok';
  return NextResponse.json(checks, { status: checks.ok ? 200 : 503 });
}
