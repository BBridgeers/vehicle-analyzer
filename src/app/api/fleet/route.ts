import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

const FLEET_KEY = 'vera_fleet_prod'; // Use a specific key for KV

export async function GET() {
  try {
    const fleet = await kv.get(FLEET_KEY) || [];
    return NextResponse.json(fleet);
  } catch (error) {
    console.error('[Fleet API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const vehicle = await req.json();
    
    // Get current fleet
    const fleet: any[] = await kv.get(FLEET_KEY) || [];
    
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
    
    await kv.set(FLEET_KEY, fleet);
    
    return NextResponse.json({ success: true, vehicle: newEntry });
  } catch (error) {
    console.error('[Fleet API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to update fleet' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
      const { id } = await req.json();
      const fleet: any[] = await kv.get(FLEET_KEY) || [];
      const updatedFleet = fleet.filter(v => v.id !== id);
      await kv.set(FLEET_KEY, updatedFleet);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
