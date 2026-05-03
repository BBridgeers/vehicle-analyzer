import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { scrapeVehicle } from '@/lib/scrapers';

// Fixed Craigslist Dallas search URLs — these are the entry points for a sweep
const SOURCE_URLS: Record<string, string[]> = {
  craigslist: [
    'https://dallas.craigslist.org/search/cta?min_price=1000&max_price=7000&max_miles=100000&min_auto_year=2006&auto_title_status=1&purveyor=owner#search=1~list~0~0',
  ],
  // Facebook and AutoTempest need Playwright — stub for now, Craigslist works serverlessly
  facebook: [],
  autotempest: [],
};

function generateId(): string {
  return `sweep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dedupeKey(source: string, url: string): string {
  // Simple hash for dedup
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const chr = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `scraper:dedup:${source}:${Math.abs(hash)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      sources = ['craigslist'],
      region = 'dallas',
      maxPrice = 7000,
      maxMileage = 100000,
      make = '',
      model = '',
    } = body;

    const jobId = generateId();
    const sourcesToRun: string[] = Array.isArray(sources) ? sources : [sources];

    // Create job record
    await kv.hset('scraper:jobs', {
      [jobId]: JSON.stringify({
        status: 'in_progress',
        created_at: new Date().toISOString(),
        params: { sources: sourcesToRun, region, maxPrice, maxMileage, make, model },
        total_results: 0,
        sources_completed: 0,
      }),
    });

    // Run each source in sequence (fire-and-forget, results written to Redis)
    const results: any[] = [];
    let totalFound = 0;

    for (const source of sourcesToRun) {
      const urls = SOURCE_URLS[source] || [];
      if (urls.length === 0) {
        // Source not available (requires browser) — mark as skipped
        continue;
      }

      try {
        for (const url of urls) {
          // Check dedup
          const dk = dedupeKey(source, url);
          const alreadySeen = await kv.get(dk);
          if (alreadySeen) continue;

          try {
            const vehicle = await scrapeVehicle(url);
            if (vehicle) {
              // Mark URL as seen
              await kv.set(dk, '1', { ex: 86400 * 30 });

              const record = {
                source: source === 'craigslist' ? 'cl' : source,
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

              // Add to ZSET for this job
              await kv.zadd(`scraper:results:${jobId}`, {
                score: Date.now(),
                member: JSON.stringify(record),
              });

              results.push(record);
              totalFound++;
            }
          } catch (e: any) {
            console.error(`[sweep] Error scraping ${url}:`, e.message);
          }
        }
      } catch (e: any) {
        console.error(`[sweep] Source ${source} failed:`, e.message);
      }
    }

    // Update job as completed
    await kv.hset('scraper:jobs', {
      [jobId]: JSON.stringify({
        status: 'completed',
        created_at: new Date().toISOString(),
        params: { sources: sourcesToRun, region, maxPrice, maxMileage, make, model },
        total_results: totalFound,
        sources_completed: sourcesToRun.length,
      }),
    });

    return NextResponse.json(
      {
        sweepId: jobId,
        status: 'completed',
        sourcesQueued: sourcesToRun,
        totalResults: totalFound,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[sweep] Error:', error);
    return NextResponse.json({ error: error.message || 'Sweep failed' }, { status: 500 });
  }
}
