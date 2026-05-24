import { NextRequest, NextResponse } from 'next/server';
import type { Redis } from '@upstash/redis';

declare const kv: Redis;

/**
 * Market Analytics Stats API
 * Returns aggregated market metrics for a given region and data horizon.
 * Powers the Market Analytics page with real scraped vehicle data.
 *
 * Query params:
 *   - region: 'tx' (default), 'ca', 'fl', 'ny', 'nat'
 *   - horizon: '7d', '30d', '90d', '6m', 'ytd' (default: '30d')
 *   - class: optional filter
 *   - priceMin, priceMax: price range filter
 */

// Region mapping
const REGION_MAP: Record<string, string[]> = {
  tx: ['dallas', 'houston', 'austin', 'san Antonio', 'fortworth'],
  ca: ['losangeles', 'sanfrancisco', 'sandiego', 'sacramento', 'sanjose'],
  fl: ['miami', 'orlando', 'tampa', 'jacksonville', 'ftlauderdale'],
  ny: ['newyork', 'albany', 'buffalo', 'longisland', 'rome'],
  nat: [],
};

// Class mapping
const CLASS_MAP: Record<string, string[]> = {
  sedan: ['Sedan', 'Compact', 'Midsize'],
  suv: ['SUV', 'Crossover', '4x4'],
  truck: ['Truck', 'Pickup', 'Heavy Duty'],
  ev: ['Electric', 'EV', 'Plug-in Hybrid', 'Hybrid'],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const region = searchParams.get('region') || 'tx';
    const horizon = searchParams.get('horizon') || '30d';
    const minPrice = parseInt(searchParams.get('priceMin') || '0', 10);
    const maxPrice = parseInt(searchParams.get('priceMax') || '50000', 10);
    const vehicleClass = searchParams.get('class') || '';

    const regions = REGION_MAP[region] || REGION_MAP['tx'];
    
    const now = new Date();
    let cutoff = new Date();
    switch (horizon) {
      case '7d': cutoff.setDate(now.getDate() - 7); break;
      case '90d': cutoff.setDate(now.getDate() - 90); break;
      case '6m': cutoff.setMonth(now.getMonth() - 6); break;
      case 'ytd': cutoff = new Date(now.getFullYear(), 0, 1); break;
      default: cutoff.setDate(now.getDate() - 30);
    }

    const cutoffDate = cutoff.toISOString();

    const jobData = await (kv as any).hgetall('scraper:jobs');
    const allResults: any[] = [];

    if (jobData) {
      const jobIds = Object.keys(jobData);

      for (const jobId of jobIds) {
        const jobRaw = await (kv as any).hget('scraper:jobs', jobId);
        let job: any;
        try { job = typeof jobRaw === 'string' ? JSON.parse(jobRaw) : jobRaw; } catch { job = jobRaw; }
        
        if (job.created_at && new Date(job.created_at) < cutoff) continue;

        const rawResults = await (kv as any).zrange(`scraper:results:${jobId}`, 0, -1);
        if (Array.isArray(rawResults)) {
          for (const m of rawResults) {
            try {
              const v = typeof m === 'string' ? JSON.parse(m) : m;
              
              const price = v.price ?? v.listingPrice ?? v.pricing?.price;
              if (!price || price < minPrice || price > maxPrice) continue;

              if (regions.length > 0 && v.location) {
                const locLower = v.location.toLowerCase();
                if (!regions.some(r => locLower.includes(r.toLowerCase())) && region !== 'nat') continue;
              }

              if (vehicleClass && CLASS_MAP[vehicleClass]) {
                const expectedTypes = CLASS_MAP[vehicleClass];
                const vClass = (v.bodyStyle || v.vehicleClass || v.body_type || '').toLowerCase();
                if (!expectedTypes.some(t => vClass.includes(t.toLowerCase()))) continue;
              }

              allResults.push(v);
            } catch { /* skip invalid */ }
          }
        }
      }
    }

    const metrics = computeMarketMetrics(allResults);

    return NextResponse.json({
      region,
      horizon,
      refreshed_at: new Date().toISOString(),
      ...metrics,
      price_range: { min: minPrice, max: maxPrice },
    });
  } catch (error: any) {
    console.error('[analytics/stats] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to compute analytics', 
    }, { status: 500 });
  }
}

/**
 * Compute market metrics from raw vehicle data
 */
function computeMarketMetrics(listings: any[]) {
  if (!listings || listings.length === 0) {
    return {
      market_heat: { index: 'Cold', change: 0 },
      avg_days_on_market: null,
      avg_price: null,
      price_negotiation_room: null,
      top_opportunity_segment: { label: 'N/A', score: 0 },
      class_distribution: {},
      price_distribution: { low: 0, mid: 0, high: 0 },
      anomalies: [],
      opportunity_heatmap: [],
      total_listings: 0,
    };
  }

  const prices = listings
    .map(l => l.price ?? l.listingPrice ?? l.pricing?.price)
    .filter((p): p is number => typeof p === 'number' && p > 0);

  const daysOnMarket = listings
    .map(l => l.daysOnMarket ?? l.days_on_market ?? l.listingAge ?? l.age_days)
    .filter((d): d is number => typeof d === 'number' && d >= 0);

  const classDist: Record<string, number> = {};
  for (const l of listings) {
    const type = (l.bodyStyle || l.vehicleClass || l.body_type || 'Unknown').toLowerCase();
    const cleanType = type.replace(/\s+/g, '-');
    classDist[cleanType] = (classDist[cleanType] || 0) + 1;
  }

  const priceBuckets = { low: 0, mid: 0, high: 0 };
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const thresholdMid = avgPrice * 0.8;
  const thresholdHigh = avgPrice * 1.2;
  
  for (const p of prices) {
    if (p < thresholdMid) priceBuckets.low++;
    else if (p > thresholdHigh) priceBuckets.high++;
    else priceBuckets.mid++;
  }

  const negotiationRoom = prices.length ? Math.round(
    prices.filter(p => p < 100000).reduce((a, b) => a + b, 0) / prices.length * 0.05
  ) : 0;

  const totalListings = listings.length;
  let marketHeat = 'Cold';
  let heatChange = 0;
  if (totalListings > 100) { marketHeat = 'Hot'; heatChange = 15; }
  else if (totalListings > 50) { marketHeat = 'Warm'; heatChange = 8; }
  else if (totalListings > 20) { marketHeat = 'Mild'; heatChange = 3; }
  else { marketHeat = 'Cold'; heatChange = -5; }

  let topClass = 'N/A';
  let topScore = 0;
  for (const [cls, count] of Object.entries(classDist)) {
    const score = count * (1 + (avgPrice > 0 ? (15000 / avgPrice) : 0));
    if (score > topScore) { topScore = score; topClass = cls.toUpperCase(); }
  }

  const anomalies = [];
  if (totalListings > 50 && prices.length > 0) {
    const stdDev = Math.sqrt(
      prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
    );
    if (stdDev > avgPrice * 0.3) anomalies.push({
      type: 'high-price-variability',
      severity: 'medium',
      message: `High price variance detected (${Math.round(stdDev)} SD). Market segmented.`,
    });
  }
  
  if (marketHeat === 'Hot' && prices.length > 0) {
    anomalies.push({
      type: 'hot-market',
      severity: 'low',
      message: 'High volume in market — fast-moving inventory.',
    });
  }

  const heatmap = [];
  for (const [cls, count] of Object.entries(classDist).slice(0, 6)) {
    const classPrices = prices.filter((_, i) => {
      const v = listings[i];
      const vClass = (v.bodyStyle || v.vehicleClass || v.body_type || '').toLowerCase();
      return vClass.includes(cls);
    });
    const classAvg = classPrices.length ? Math.round(classPrices.reduce((a, b) => a + b, 0) / classPrices.length) : 0;
    heatmap.push({
      class: cls,
      count,
      avgPrice: classAvg,
      opportunityScore: count * (100 - (avgPrice > 0 ? Math.min(100, avgPrice / 1000) : 0)),
    });
  }

  return {
    total_listings: totalListings,
    avg_price: avgPrice,
    avg_days_on_market: daysOnMarket.length ? Math.round(daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length) : null,
    price_negotiation_room: negotiationRoom,
    market_heat: {
      index: marketHeat,
      change: heatChange,
    },
    top_opportunity_segment: {
      label: topClass,
      score: Math.round(topScore),
    },
    class_distribution: classDist,
    price_distribution: priceBuckets,
    anomalies: anomalies.slice(0, 5),
    opportunity_heatmap: heatmap,
  };
}
