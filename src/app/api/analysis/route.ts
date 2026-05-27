import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { getCurrentUserId } from '@/lib/kv-user-wrapper';

const ANALYSIS_KEY = 'analysis';

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    const data = await kv.get(`${userId}:${ANALYSIS_KEY}`) as { vehicle: any; result: any; timestamp: string } | null;
    
    if (!data) {
      return NextResponse.json({ success: false, error: 'No analysis found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, vehicle: data.vehicle, result: data.result, timestamp: data.timestamp });
  } catch (error) {
    console.error('[Analysis API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    const body = await req.json();
    
    const data = {
      vehicle: body.vehicle,
      result: body.result,
      timestamp: new Date().toISOString(),
    };
    
    await kv.set(`${userId}:${ANALYSIS_KEY}`, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analysis API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}
