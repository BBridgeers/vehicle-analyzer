import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const source = searchParams.get('source') || '';

    // Gather all results from all job ZSETs
    // First, get all job IDs
    const jobData = await kv.hgetall('scraper:jobs');
    const allResults: any[] = [];

    if (jobData) {
      const jobIds = Object.keys(jobData);

      for (const jobId of jobIds) {
        const raw = await kv.zrange(`scraper:results:${jobId}`, 0, -1);
        if (Array.isArray(raw)) {
          for (const m of raw) {
            try {
              const v = typeof m === 'string' ? JSON.parse(m) : m;
              if (!source || v.source === source) {
                allResults.push(v);
              }
            } catch { /* skip */ }
          }
        }
      }
    }

    // Sort by scraped_at descending (newest first)
    allResults.sort((a, b) => {
      const ta = a.scraped_at ? new Date(a.scraped_at).getTime() : 0;
      const tb = b.scraped_at ? new Date(b.scraped_at).getTime() : 0;
      return tb - ta;
    });

    const total = allResults.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paged = allResults.slice(start, start + limit);

    return NextResponse.json({
      results: paged,
      total,
      page,
      totalPages,
    });
  } catch (error: any) {
    console.error('[results] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get results' }, { status: 500 });
  }
}
