import { NextRequest, NextResponse } from 'next/server';

// Helper
function transformFleetToCompare(fleetVehicle: any, index: number): any {
  const score = fleetVehicle.score || 50;
  const isHigh = score >= 80;
  const isLow = score < 50;
  
  return {
    id: fleetVehicle.id || index,
    name: fleetVehicle.name || 'Unknown',
    sub: '',
    topColor: isHigh ? 'bg-green-500' : isLow ? 'bg-red-500' : 'bg-yellow-500',
    bgCard: 'bg-[#161513]',
    borderCard: 'border-[#3a3730]',
    verdictLabel: isHigh ? 'Recommended' : isLow ? 'Avoid' : 'Proceed w/ Caution',
    verdictLabelColor: isHigh ? 'text-green-400' : isLow ? 'text-red-400' : 'text-yellow-400',
    verdictScore: score,
    verdictScoreColor: isHigh ? 'text-green-200' : isLow ? 'text-red-200' : 'text-yellow-200',
    price: fleetVehicle.price || '$' + (fleetVehicle.listingPrice || fleetVehicle.price || 'N/A'),
    equity: fleetVehicle.equity || 'N/A',
    mileage: fleetVehicle.miles || 'N/A',
    title: fleetVehicle.badge || 'Unknown',
    sellerType: fleetVehicle.location || 'Unknown',
    sellerLoc: '',
    isAvoid: isLow,
    rowBg: isLow ? 'bg-red-950/10' : '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    // This will be replaced with actual Upstash Redis client when deployed
    // For now, return empty data (Vercel will use kv from @/lib/kv)
    return NextResponse.json({ 
      vehicles: [],
      selected: !!idsParam,
    });
  } catch (error: any) {
    console.error('[comparison] GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.method === 'import') {
      const ids = body.ids || [];
      return NextResponse.json({ success: true, count: ids.length, ids });
    }
    
    if (body.method === 'export') {
      return NextResponse.json({ success: true, message: 'Export triggered' });
    }
    
    return NextResponse.json({ error: 'Unknown method' }, { status: 400 });
  } catch (error: any) {
    console.error('[comparison] POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
