import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { scrapeVehicle } from '@/lib/scrapers';

function dedupeKey(source: string, url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const chr = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `scraper:dedup:${source}:${Math.abs(hash)}`;
}

export async function GET(request: NextRequest) {
  try {
    // Simple auth via CRON_SECRET header
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default sweep params
    const sources = ['craigslist'];
    const maxPrice = 7000;
    const maxMileage = 100000;
    const region = 'dallas';

    const jobId = `cron_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const urls = ['https://dallas.craigslist.org/search/cta?min_price=1000&max_price=7000&max_miles=100000&min_auto_year=2006&auto_title_status=1&purveyor=owner#search=1~list~0~0'];

    await kv.hset('scraper:jobs', {
      [jobId]: JSON.stringify({
        status: 'in_progress',
        created_at: new Date().toISOString(),
        params: { sources, region, maxPrice, maxMileage },
        total_results: 0,
      }),
    });

    let totalFound = 0;

    for (const url of urls) {
      const dk = dedupeKey('craigslist', url);
      const alreadySeen = await kv.get(dk);
      if (alreadySeen) continue;

      try {
        const vehicle = await scrapeVehicle(url);
        if (vehicle) {
          await kv.set(dk, '1', { ex: 86400 * 30 });

          const record = {
            source: 'cl',
            title: vehicle.title,
            price: vehicle.price,
            mileage: vehicle.mileage,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            location: vehicle.location || region,
            url: vehicle.sourceUrl || url,
            scraped_at: new Date().toISOString(),
          };

          await kv.zadd(`scraper:results:${jobId}`, {
            score: Date.now(),
            member: JSON.stringify(record),
          });
          totalFound++;
        }
      } catch (e: any) {
        console.error(`[cron] Error scraping ${url}:`, e.message);
      }
    }

    await kv.hset('scraper:jobs', {
      [jobId]: JSON.stringify({
        status: 'completed',
        created_at: new Date().toISOString(),
        params: { sources, region, maxPrice, maxMileage },
        total_results: totalFound,
      }),
    });

    return NextResponse.json({ sweepId: jobId, status: 'completed', totalResults: totalFound });
  } catch (error: any) {
    console.error('[cron/sweep] Error:', error);
    return NextResponse.json({ error: error.message || 'Cron sweep failed' }, { status: 500 });
  }
}
