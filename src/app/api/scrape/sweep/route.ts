import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { scrapeVehicle } from '@/lib/scrapers';

// Fixed Craigslist Dallas search URLs — these are the entry points for a sweep
const SOURCE_URLS: Record<string, string[]> = {
  craigslist: [],  // now uses dynamic VPS scraper (JSON-LD based, much richer data)
  facebook: [],    // uses VPS stealth scraper (headless browser)
  autotempest: [],
};

// VPS Scraper API base URL — defaults to localhost for dev, set in Vercel env for production
const VPS_SCRAPER_URL = process.env.VPS_SCRAPER_URL || 'http://localhost:8765';

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

async function scrapeFacebookMarketplace(params: {
  query?: string;
  location?: string;
  maxPrice?: number;
  minYear?: number;
  maxResults?: number;
}): Promise<any[]> {
  try {
    const resp = await fetch(`${VPS_SCRAPER_URL}/api/scrape/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query || '',
        location: params.location || 'dallas',
        max_price: params.maxPrice,
        min_year: params.minYear,
        max_results: params.maxResults || 20,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      console.error(`[sweep] FB scraper returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    console.log(`[sweep] FB scraper found ${data.total_found || 0} listings via ${data.strategy_used}`);
    return data.listings || [];
  } catch (e: any) {
    console.error('[sweep] FB scraper error:', e.message);
    return [];
  }
}

async function scrapeCraigslistMarketplace(params: {
  query?: string;
  city?: string;
  maxPrice?: number;
  minYear?: number;
  maxMileage?: number;
  maxResults?: number;
}): Promise<any[]> {
  try {
    const resp = await fetch(`${VPS_SCRAPER_URL}/api/scrape/craigslist/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query || '',
        city: params.city || 'dallas',
        max_price: params.maxPrice,
        min_year: params.minYear,
        max_mileage: params.maxMileage,
        max_results: params.maxResults || 30,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      console.error(`[sweep] CL scraper returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    console.log(`[sweep] CL scraper found ${data.total_found || 0} listings via ${data.strategy_used}`);
    return data.listings || [];
  } catch (e: any) {
    console.error('[sweep] CL scraper error:', e.message);
    return [];
  }
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
        // Source not available via static URLs — try dynamic scraper
        if (source === 'facebook') {
          try {
            // Parse comma-separated makes and models for multi-search
            const makes = (make || '').split(',').map((s: string) => s.trim()).filter(Boolean);
            const models = (model || '').split(',').map((s: string) => s.trim()).filter(Boolean);

            // Build query combinations — all make×model cross-product
            const queries: string[] = [];
            if (makes.length > 0 && models.length > 0) {
              for (const m of makes) {
                for (const mo of models) {
                  queries.push(`${m} ${mo}`);
                }
              }
            } else if (makes.length > 0) {
              queries.push(...makes);
            } else if (models.length > 0) {
              queries.push(...models);
            }

            // If no specific make/model, single broad search
            if (queries.length === 0) queries.push('');

            // Run all searches in parallel — max 3 concurrent to avoid FB rate limits
            const chunkSize = 3;
            const allFbResults: any[] = [];
            const seenUrls = new Set<string>();

            for (let i = 0; i < queries.length; i += chunkSize) {
              const chunk = queries.slice(i, i + chunkSize);
              const chunkResults = await Promise.allSettled(
                chunk.map(q =>
                  scrapeFacebookMarketplace({
                    query: q,
                    location: region || 'dallas',
                    maxPrice: maxPrice || 7000,
                    minYear: make ? undefined : 2006,
                    maxResults: Math.ceil(20 / queries.length) || 10,
                  })
                )
              );

              for (const r of chunkResults) {
                if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                  for (const listing of r.value) {
                    // Deduplicate by URL
                    const url = listing.sourceUrl || listing.url || '';
                    if (url && seenUrls.has(url)) continue;
                    if (url) seenUrls.add(url);
                    allFbResults.push(listing);
                  }
                }
              }
            }

            // Deduplicate final results by URL
            const deduped = new Map<string, any>();
            for (const listing of allFbResults) {
              const key = listing.sourceUrl || listing.url || `${listing.title}-${listing.price}`;
              if (!deduped.has(key)) deduped.set(key, listing);
            }

            for (const listing of deduped.values()) {
              const record = {
                source: 'fb',
                title: listing.title || `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim(),
                price: listing.price || 0,
                mileage: listing.mileage || null,
                year: listing.year || null,
                make: listing.make || '',
                model: listing.model || '',
                trim: listing.trim || '',
                vin: listing.vin || '',
                location: listing.location || region,
                url: listing.sourceUrl || '',
                scraped_at: new Date().toISOString(),
                description: listing.description || '',
                postedDate: listing.postedDate || '',
                titleStatus: listing.titleStatus || '',
                images: listing.images || [],
                bodyStyle: listing.bodyStyle || '',
                transmission: listing.transmission || '',
                fuelType: listing.fuelType || '',
                drivetrain: listing.drivetrain || '',
                engine: listing.engine || '',
                cylinders: listing.cylinders || null,
                exteriorColor: listing.exteriorColor || '',
                interiorColor: listing.interiorColor || '',
                seats: listing.seats || null,
                mpg: listing.mpg || '',
                condition: listing.condition || '',
                conditionExterior: listing.conditionExterior || '',
                conditionInterior: listing.conditionInterior || '',
                conditionMechanical: listing.conditionMechanical || '',
                safetyRating: listing.safetyRating || '',
                numOwners: listing.numOwners || null,
                paidOff: listing.paidOff || false,
                sellerName: listing.sellerName || '',
                sellerResponsiveness: listing.sellerResponsiveness || 'not-contacted',
                sellerTransparency: listing.sellerTransparency || 'not-assessed',
                sellerRedFlags: listing.sellerRedFlags || '',
                sellerQuotes: listing.sellerQuotes || '',
              };

              await kv.zadd(`scraper:results:${jobId}`, {
                score: Date.now(),
                member: JSON.stringify(record),
              });

              results.push(record);
              totalFound++;
            }
          } catch (e: any) {
            console.error(`[sweep] Facebook source failed:`, e.message);
          }
        } else if (source === 'craigslist') {
          try {
            // Build query from make/model for dynamic CL search
            const makes = (make || '').split(',').map((s: string) => s.trim()).filter(Boolean);
            const models = (model || '').split(',').map((s: string) => s.trim()).filter(Boolean);

            const queries: string[] = [];
            if (makes.length > 0 && models.length > 0) {
              for (const m of makes) {
                for (const mo of models) {
                  queries.push(`${m} ${mo}`);
                }
              }
            } else if (makes.length > 0) {
              queries.push(...makes);
            } else {
              queries.push('');  // broad search if no specific make
            }

            const allClResults: any[] = [];
            const seenUrls = new Set<string>();

            // Run searches sequentially (CL is fine with this)
            for (const q of queries) {
              const listings = await scrapeCraigslistMarketplace({
                query: q,
                city: region || 'dallas',
                maxPrice: maxPrice || 7000,
                minYear: make ? undefined : 2006,
                maxMileage: maxMileage,
                maxResults: 25,
              });

              for (const listing of listings) {
                const url = listing.source_url || listing.url || '';
                if (url && seenUrls.has(url)) continue;
                if (url) seenUrls.add(url);
                allClResults.push(listing);
              }
            }

            for (const listing of allClResults) {
              const record = {
                source: 'cl',
                title: listing.title || `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim(),
                price: listing.price || 0,
                mileage: listing.mileage || null,
                year: listing.year || null,
                make: listing.make || '',
                model: listing.model || '',
                trim: listing.trim || '',
                vin: listing.vin || '',
                location: listing.location || region,
                url: listing.source_url || '',
                scraped_at: new Date().toISOString(),
                description: listing.description || '',
                postedDate: listing.posted_date || '',
                titleStatus: listing.title_status || '',
                images: listing.images || [],
                bodyStyle: listing.body_style || '',
                transmission: listing.transmission || '',
                fuelType: listing.fuel_type || '',
                drivetrain: listing.drivetrain || '',
                engine: listing.engine || '',
                cylinders: listing.cylinders || null,
                exteriorColor: listing.exterior_color || '',
                interiorColor: listing.interior_color || '',
                seats: listing.seats || null,
                mpg: listing.mpg || '',
                condition: listing.condition || '',
                conditionExterior: listing.condition_exterior || '',
                conditionInterior: listing.condition_interior || '',
                conditionMechanical: listing.condition_mechanical || '',
                safetyRating: listing.safety_rating || '',
                numOwners: listing.num_owners || null,
                paidOff: listing.paid_off || false,
                sellerName: listing.seller_name || '',
                sellerResponsiveness: listing.seller_responsiveness || 'not-contacted',
                sellerTransparency: listing.seller_transparency || 'not-assessed',
                sellerRedFlags: listing.seller_red_flags || '',
                sellerQuotes: listing.seller_quotes || '',
              };

              await kv.zadd(`scraper:results:${jobId}`, {
                score: Date.now(),
                member: JSON.stringify(record),
              });

              results.push(record);
              totalFound++;
            }
          } catch (e: any) {
            console.error(`[sweep] Craigslist source failed:`, e.message);
          }
        }
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
