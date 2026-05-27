import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { getCurrentUserId } from '@/lib/kv-user-wrapper';

const FORM_KEY = 'last_form';

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    const form = await kv.get(`${userId}:${FORM_KEY}`);
    return NextResponse.json({ success: true, form: form || null });
  } catch (error) {
    console.error('[Form API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    const body = await req.json();
    await kv.set(`${userId}:${FORM_KEY}`, body.form);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Form API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to save form' }, { status: 500 });
  }
}
