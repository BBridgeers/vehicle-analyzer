import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0') || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999') || 999999;
    const format = searchParams.get('format') || 'csv';

    // Gather all results
    const jobData = await kv.hgetall('scraper:jobs');
    const allResults: any[] = [];

    if (jobData) {
      for (const jobId of Object.keys(jobData)) {
        const raw = await kv.zrange(`scraper:results:${jobId}`, 0, -1);
        if (Array.isArray(raw)) {
          for (const m of raw) {
            try {
              const v = typeof m === 'string' ? JSON.parse(m) : m;
              const p = typeof v.price === 'number' ? v.price : parseInt(v.price, 10) || 0;
              if ((!source || v.source === source) && p >= minPrice && p <= maxPrice) {
                allResults.push(v);
              }
            } catch { /* skip */ }
          }
        }
      }
    }

    // Sort newest first
    allResults.sort((a, b) => {
      const ta = a.scraped_at ? new Date(a.scraped_at).getTime() : 0;
      const tb = b.scraped_at ? new Date(b.scraped_at).getTime() : 0;
      return tb - ta;
    });

    if (format === 'json') {
      return NextResponse.json({ results: allResults, total: allResults.length });
    }

    // CSV
    const headers = ['source', 'title', 'price', 'mileage', 'year', 'make', 'model', 'location', 'url', 'scraped_at'];
    const csvRows = [headers.join(',')];

    for (const r of allResults) {
      const row = headers.map(h => {
        const val = r[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `vehicle-sweep-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[export] Error:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
