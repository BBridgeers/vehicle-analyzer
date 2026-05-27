import { NextRequest } from 'next/server';
import { kvGet, kvSet } from '@/lib/kv-client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Fetch vehicle and analysis data from KV
    const vehicle = await kvGet<any>(`analysis:${id}:vehicle`);
    const analysis = await kvGet<any>(`analysis:${id}:result`);

    if (!vehicle || !analysis) {
      return Response.json({ success: false, error: 'Analysis not found' }, { status: 404 });
    }

    return Response.json({ 
      success: true, 
      vehicle,
      analysis 
    });
  } catch (error: any) {
    console.error('Analysis API Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
