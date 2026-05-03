import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = decodeURIComponent(id);

    // Get job metadata from scraper:jobs hash
    const jobRaw = await kv.hget('scraper:jobs', jobId);
    if (!jobRaw) {
      return NextResponse.json({ error: 'Sweep job not found' }, { status: 404 });
    }

    let job: any;
    try {
      job = typeof jobRaw === 'string' ? JSON.parse(jobRaw) : jobRaw;
    } catch {
      job = jobRaw;
    }

    // Get results from ZSET
    const zresults = await kv.zrange(`scraper:results:${jobId}`, 0, -1);

    const results = Array.isArray(zresults)
      ? zresults.map((m: string) => {
          try { return JSON.parse(m); } catch { return m; }
        })
      : [];

    return NextResponse.json({
      sweepId: jobId,
      status: job.status,
      created_at: job.created_at,
      params: job.params,
      total_results: job.total_results ?? results.length,
      results,
    });
  } catch (error: any) {
    console.error('[sweep/:id] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get sweep status' }, { status: 500 });
  }
}
