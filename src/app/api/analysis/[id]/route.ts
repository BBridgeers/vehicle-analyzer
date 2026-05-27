import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch vehicle and analysis data from localStorage
    const stored = localStorage.getItem(`analysis_${id}`);
    if (!stored) {
      return Response.json({ success: false, error: 'Analysis not found' }, { status: 404 });
    }

    const { vehicle, result } = JSON.parse(stored);

    return Response.json({ 
      success: true, 
      vehicle,
      analysis: result 
    });
  } catch (error: any) {
    console.error('Analysis API Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
