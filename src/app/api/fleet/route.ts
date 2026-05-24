import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { rateLimitByUser, EXTRACT_LIMIT } from '@/lib/rate-limit';
import { getCurrentUserId } from '@/lib/kv-user-wrapper';

// User-scoped fleet key
const FLEET_KEY = 'fleet';

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    const fleet = await kv.get(`${userId}:${FLEET_KEY}`) || [];
    return NextResponse.json(fleet);
  } catch (error) {
    console.error('[Fleet API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    
    // Rate limiting check
    const rateCheck = await rateLimitByUser(
      'fleet_create',
      EXTRACT_LIMIT.max,
      EXTRACT_LIMIT.windowSec,
      userId
    );
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil((rateCheck.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const vehicle = await req.json();
    
    // Get current fleet (user-scoped)
    const fleet: any[] = await kv.get(`${userId}:${FLEET_KEY}`) || [];
    
    // Add new vehicle with a server-side timestamp
    const newEntry = {
      ...vehicle,
      id: vehicle.id || Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    fleet.unshift(newEntry);
    
    // Limits history to 100 entries per fleet for now
    if (fleet.length > 100) {
      fleet.length = 100;
    }
    
    await kv.set(`${userId}:${FLEET_KEY}`, fleet);
    
    return NextResponse.json({ success: true, vehicle: newEntry });
  } catch (error) {
    console.error('[Fleet API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to update fleet' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
      const userId = await getCurrentUserId(req);
      const { id } = await req.json();
      const fleet: any[] = await kv.get(`${userId}:${FLEET_KEY}`) || [];
      const updatedFleet = fleet.filter(v => v.id !== id);
      await kv.set(`${userId}:${FLEET_KEY}`, updatedFleet);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
