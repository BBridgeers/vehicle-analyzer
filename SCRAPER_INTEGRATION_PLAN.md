# Scraper API Integration Plan

> **Project**: vehicle-analyzer (V.E.R.A.)  
> **Context**: Three standalone scraper subagent scripts exist (`fb_subagent.ts`, `cl_subagent.ts`, `at_subagent.ts`) but have zero API integration. This plan covers wiring them into the Next.js App Router, storing results in Redis, surfacing them in the frontend, generating CSV exports, and scheduling periodic sweeps.

---

## 1. Current State Analysis

### 1.1 What the Subagents Do

| Subagent | Source | Method | Key Filters | Lemon Detection | Output |
|---|---|---|---|---|---|
| `fb_subagent.ts` | Facebook Marketplace | Playwright + stealth browser, 50% zoom screenshot → Gemini Vision | DFW, $1k-$7k, <100k mi, 2006+, Cars/Trucks/SUVs, Private only | Gemini Vision extraction includes lemon JSON | `golden_vehicles.json` |
| `cl_subagent.ts` | Craigslist (Dallas) | cheerio HTML parse → existing `scrapeVehicle()` factory, then Gemini text-only lemon filter | DFW, $7k max, <100k mi, Clean title, By owner, 2006+ | Gemini text-only prompt | `cl_golden_vehicles.json` |
| `at_subagent.ts` | AutoTempest | Playwright + stealth browser, 50% zoom screenshot → Gemini Vision | Dallas ZIP 75201, 50mi, $7k max, <100k mi, Clean title, 2006+ | Gemini Vision extraction includes lemon JSON | `at_golden_vehicles.json` |

Common output shape per vehicle:
```json
{
  "url": "https://...",
  "year": 2015,
  "make": "Toyota",
  "model": "Camry",
  "trim": "LE",
  "price": 5500,
  "mileage": 95000,
  "titleStatus": "Clean",
  "sellerType": "Private",
  "lemonStatus": { "isLemon": false, "reason": null },
  "description": "...",
  "conditionExterior": "..."
}
```

### 1.2 Existing API Routes

| Route | Method | Purpose | Redis? |
|---|---|---|---|
| `/api/import-url` | POST | Scrape single URL via `scrapeVehicle()` factory | No |
| `/api/extract-listing` | POST | Vision extraction from screenshot | Rate-limit only |
| `/api/fleet` | GET/POST/DELETE | Fleet CRUD | Yes (`vera_fleet_prod`) |
| `/api/vin` | POST | VIN decode + Antigravity analysis | Yes (per-VIN cache) |
| `/api/analyze-carfax` | POST | CARFAX PDF upload → AI analysis | No |
| `/api/chat` | POST | Streaming Groq chat | Rate-limit only |

### 1.3 Existing Redis Schema

| Key Pattern | Purpose | Data Shape |
|---|---|---|
| `vera_fleet_prod` | User's saved fleet | `Vehicle[]` (max 100) |
| `<VIN>` (bare, 17-char) | Antigravity VIN analysis cache | `VinAnalysis` object |
| `extract:<ip>` | Rate limit counter | Integer + TTL |
| `chat:<ip>` | Rate limit counter | Integer + TTL |

### 1.4 Existing Scraper Library

`/src/lib/scrapers/` provides:
- `ScrapedVehicle` interface
- `CraigslistScraper` (cheerio, handles `craigslist.org`)
- `AutoTempestScraper` (cheerio, handles `autotempest.com`)
- `scrapeVehicle(url)` — registry-based dispatcher

**Gap**: No Facebook Marketplace scraper in the library, no vision-based extraction, no lemon filtering.

---

## 2. New API Routes Needed

### 2.1 `POST /api/scrape/sweep`

**Purpose**: Trigger a full sweep across one or all sources. This is the main entry point for both manual and cron-initiated sweeps.

**Request**:
```json
{
  "sources": ["facebook", "craigslist", "autotempest"],  // omit = all
  "maxVehicles": 25,          // per-source cap (default 25)
  "filters": {                // optional overrides
    "minYear": 2006,
    "maxPrice": 7000,
    "maxMileage": 100000,
    "location": "dallas",
    "privateOnly": true
  }
}
```

**Response** (202 Accepted):
```json
{
  "sweepId": "sweep:2026-05-03T08:00:00Z",
  "status": "in_progress",
  "sourcesQueued": ["facebook", "craigslist", "autotempest"],
  "estimatedCompletionSeconds": 120
}
```

**Behavior**:
- Creates a sweep record in Redis with status `in_progress`
- Fires each source subagent asynchronously (fire-and-forget within the same process, or via Next.js `waitUntil` if on Vercel)
- Each subagent populates Redis as it finds results
- On completion, sweep status is updated to `completed` or `failed`
- Rate-limited: max 1 concurrent sweep per user/IP; max 4 sweeps per day

### 2.2 `GET /api/scrape/sweep/[sweepId]`

**Purpose**: Poll sweep progress and retrieve results.

**Response**:
```json
{
  "sweepId": "sweep:2026-05-03T08:00:00Z",
  "status": "completed",          // in_progress | completed | failed
  "startedAt": "2026-05-03T08:00:00Z",
  "completedAt": "2026-05-03T08:02:15Z",
  "sources": {
    "facebook": { "status": "completed", "found": 5, "errors": [] },
    "craigslist": { "status": "completed", "found": 8, "errors": [] },
    "autotempest": { "status": "failed", "found": 0, "errors": ["Cloudflare blocked"] }
  },
  "results": [
    {
      "id": "fb:916998977756029",
      "source": "facebook",
      "url": "https://www.facebook.com/marketplace/item/...",
      "year": 2015,
      "make": "Toyota",
      "model": "Camry",
      "price": 5500,
      "mileage": 95000,
      "lemonStatus": { "isLemon": false, "reason": null },
      "titleStatus": "Clean",
      "description": "...",
      "scrapedAt": "2026-05-03T08:01:22Z"
    }
  ]
}
```

### 2.3 `GET /api/scrape/results`

**Purpose**: List historical scrape results with pagination/filtering. Used by the Fleet Dashboard and Market Analytics pages.

**Query params**:
```
?source=facebook&minYear=2006&maxPrice=7000&sort=price_asc&page=1&limit=50
```

**Response**:
```json
{
  "results": [...],
  "total": 247,
  "page": 1,
  "totalPages": 5
}
```

### 2.4 `POST /api/scrape/schedule`

**Purpose**: Configure the cron schedule for automatic sweeps.

**Request**:
```json
{
  "enabled": true,
  "intervalHours": 6,           // 1, 4, 6, 12, 24
  "sources": ["facebook", "craigslist", "autotempest"],
  "maxVehiclesPerSource": 25,
  "filters": {
    "minYear": 2006,
    "maxPrice": 7000,
    "maxMileage": 100000
  }
}
```

### 2.5 `GET /api/scrape/schedule`

**Purpose**: Retrieve current schedule config.

### 2.6 `GET /api/scrape/export`

**Purpose**: Download scraped results as CSV.

**Query params**: `?sweepId=...&source=facebook&format=csv`

**Response**: `Content-Type: text/csv` with `Content-Disposition: attachment`

---

## 3. Redis Storage Schema for Scraped Results

### 3.1 Key Design

All scraper-related keys use the `scraper:` prefix to avoid collisions with existing keys.

```
scraper:results:<source>            → ZSET (score = timestamp, member = vehicle_id)
scraper:vehicle:<vehicle_id>        → HASH (full vehicle data as JSON)
scraper:sweep:<sweep_id>            → HASH (sweep metadata + status)
scraper:sweeps                      → LIST (recent sweep IDs, newest first, capped at 50)
scraper:schedule                    → HASH (cron configuration)
scraper:lock:<source>               → STRING (distributed lock for concurrent sweep prevention)
scraper:daily_counter:<date>        → STRING (number of sweeps today, for rate limiting)
```

### 3.2 Detailed Schema

#### `scraper:results:<source>`
- **Type**: Sorted Set (ZSET)
- **Member**: `vehicle_id` (e.g., `fb:916998977756029`, `cl:1234567890`, `at:3921af...`)
- **Score**: Unix timestamp of scrape time
- **Purpose**: Time-sorted index of all results per source, enables efficient range queries

#### `scraper:vehicle:<vehicle_id>`
- **Type**: Hash or String (JSON blob)
- **Fields** (as JSON string value):
```json
{
  "id": "fb:916998977756029",
  "source": "facebook",
  "url": "https://www.facebook.com/marketplace/item/...",
  "year": 2015,
  "make": "Toyota",
  "model": "Camry",
  "trim": "LE",
  "price": 5500,
  "mileage": 95000,
  "vin": "4T1BF1FK2FU123456",
  "titleStatus": "Clean",
  "sellerType": "Private",
  "lemonStatus": { "isLemon": false, "reason": null },
  "description": "Well maintained, single owner...",
  "conditionExterior": "Minor scratch on rear bumper",
  "location": "Dallas, TX",
  "scrapedAt": "2026-05-03T08:01:22Z",
  "sweepId": "sweep:2026-05-03T08:00:00Z"
}
```
- **TTL**: 30 days (auto-expire old results to manage storage)

#### `scraper:sweep:<sweep_id>`
- **Type**: Hash
- **Fields**:
  - `status`: `in_progress` | `completed` | `failed`
  - `startedAt`: ISO timestamp
  - `completedAt`: ISO timestamp
  - `sources`: JSON string of per-source status map
  - `resultCount`: integer
  - `error`: string (if failed)

#### `scraper:sweeps`
- **Type**: List
- **Members**: sweep IDs (strings)
- **Purpose**: Ordered history of sweeps for the admin UI
- **Capped**: LPUSH + LTRIM to keep last 100

#### `scraper:schedule`
- **Type**: Hash
- **Fields**: `enabled`, `intervalHours`, `sources` (JSON), `maxVehiclesPerSource`, `filters` (JSON), `lastRunAt`, `nextRunAt`

#### `scraper:lock:<source>`
- **Type**: String
- **Value**: sweep ID
- **TTL**: 5 minutes (auto-release)
- **Set with**: `SET NX EX` for atomic lock acquisition

#### `scraper:daily_counter:<YYYY-MM-DD>`
- **Type**: String
- **Value**: integer
- **TTL**: 86400 seconds
- **Purpose**: Rate limit sweeps to 4 per day (INCR + check)

### 3.3 Deduplication Strategy

Before inserting a new scraped result, check for existing entries with the same `url` using a secondary index:

```
scraper:url_index:<md5(url)> → vehicle_id
```

On scrape, compute `MD5(url)`, check if key exists. If it does, skip insertion (or update the existing entry's `scrapedAt` timestamp). This prevents accumulating duplicate listings across sweeps.

---

## 4. Frontend Wiring

### 4.1 Main Page (`/` — page.tsx)

**Existing**: `QuickImportSection` has single-URL scrape and screenshot paste.

**Add**: A "Market Sweep" button/panel that:
1. Shows a button: "🔍 Run Market Sweep" with dropdown to select sources (Facebook, Craigslist, AutoTempest)
2. Calls `POST /api/scrape/sweep` on click
3. Polls `GET /api/scrape/sweep/[sweepId]` every 3 seconds
4. Shows progress: "Scanning Craigslist... 5 vehicles found so far"
5. On completion, displays results in a sortable/filterable table:
   - Year, Make, Model, Price, Mileage, Location, Source, Lemon Status
   - Each row has checkboxes for batch selection
   - "Add Selected to Fleet" button → `POST /api/fleet` for each selected vehicle
   - "Export to CSV" button → `GET /api/scrape/export`
   - Individual "Analyze" button per row → fills the evaluation form

**New component**: `MarketSweepPanel.tsx` — collapsible panel in the Quick Import area

### 4.2 Fleet Dashboard (`/fleet`)

**Existing**: Shows vehicles from `vera_fleet_prod` Redis key.

**Add**:
- "Import from Latest Sweep" button that fetches `GET /api/scrape/results?sort=scrapedAt_desc&limit=50` and lets user cherry-pick vehicles to add to fleet
- Each imported vehicle gets the full analysis pipeline run on it (market value, rideshare, insurance, etc.)
- Source badge on each fleet card showing where the vehicle came from (Facebook, Craigslist, AutoTempest)

### 4.3 Market Analytics (`/analytics`)

**Existing**: Mostly static/hardcoded data.

**Add**: 
- "Scraped Market Data" section that calls `GET /api/scrape/results` to populate real charts:
  - Price distribution histogram by source
  - Average price by make/model from scraped data
  - Mileage vs. price scatter plot
  - New listings per day (from `scrapedAt` timestamps)
- Filter controls: source, date range, price range, year range

### 4.4 New Page: `/sweeps` (Admin/History)

A new page showing:
- List of past sweeps with status, counts, timestamps
- "Run New Sweep" button at top
- Click a sweep to see its full results
- Export button per sweep
- Cron schedule configuration

### 4.5 Component: `ScrapedVehicleCard`

A reusable card component for displaying scraped vehicle results with:
- Thumbnail (if available)
- Key specs (year, make, model, price, mileage)
- Source badge
- Lemon status indicator
- Quick actions: "Analyze", "Add to Fleet", "Dismiss"

---

## 5. CSV Generation

### 5.1 API Route: `GET /api/scrape/export`

**Query parameters**:
| Param | Type | Default | Description |
|---|---|---|---|
| `sweepId` | string | (none) | Filter to a specific sweep |
| `source` | string | (all) | `facebook`, `craigslist`, `autotempest` |
| `minYear` | number | (none) | Minimum model year |
| `maxPrice` | number | (none) | Maximum price |
| `format` | string | `csv` | `csv` or `json` |
| `sort` | string | `scrapedAt_desc` | Sort field + direction |

**CSV Columns**:
```csv
Source,URL,Year,Make,Model,Trim,Price,Mileage,VIN,Title Status,Seller Type,Location,
Lemon?,Lemon Reason,Description,Exterior Condition,Scraped At
```

**Implementation**:
- Query Redis ZSET by score range for the requested source/date range
- Fetch each `scraper:vehicle:<id>` hash
- Stream response as CSV using `csv-stringify` or manual string building
- Set headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="vehicle-sweep-2026-05-03.csv"`

### 5.2 Client-Side CSV Download

In the `MarketSweepPanel` and `/sweeps` page:
- "Export" button builds query params and opens `window.open('/api/scrape/export?...')` or uses an anchor download
- Alternatively, fetch the blob and trigger download programmatically for better UX feedback

---

## 6. Cron / Scheduling

### 6.1 Architecture

Use **Vercel Cron Jobs** (free tier: 1 cron job) configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sweep",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

The cron endpoint reads `scraper:schedule` from Redis to determine:
- Whether sweeping is enabled
- Which sources to sweep
- How many vehicles per source

### 6.2 Cron Route: `GET /api/cron/sweep`

```typescript
// /src/app/api/cron/sweep/route.ts
export async function GET(request: Request) {
  // 1. Verify Vercel Cron secret (Authorization header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Read schedule config from Redis
  const schedule = await kv.hgetall('scraper:schedule');
  if (!schedule?.enabled) {
    return NextResponse.json({ status: 'disabled' });
  }

  // 3. Check daily rate limit
  const today = new Date().toISOString().split('T')[0];
  const count = await kv.incr(`scraper:daily_counter:${today}`);
  if (count === 1) await kv.expire(`scraper:daily_counter:${today}`, 86400);
  if (count > 4) {
    return NextResponse.json({ status: 'rate_limited' });
  }

  // 4. Trigger each source sweep (sequentially to avoid conflicts)
  const sources = JSON.parse(schedule.sources || '["facebook","craigslist","autotempest"]');
  const maxVehicles = schedule.maxVehiclesPerSource || 25;
  const filters = JSON.parse(schedule.filters || '{}');

  const sweepId = `sweep:cron:${new Date().toISOString()}`;
  // ... initialize sweep in Redis, run subagents, update status

  // 5. Update lastRunAt / nextRunAt in schedule
  await kv.hset('scraper:schedule', {
    lastRunAt: new Date().toISOString(),
    nextRunAt: new Date(Date.now() + schedule.intervalHours * 3600000).toISOString()
  });

  return NextResponse.json({ sweepId, status: 'started' });
}
```

### 6.3 Subagent Execution Strategy

Since the subagents use Playwright (which requires a full Node.js runtime with browser binaries), they cannot run on Vercel's serverless functions directly. Two options:

**Option A: Browserless.io (Recommended for Vercel)**
- Use a managed browser service like Browserless.io
- Rewrite the subagents to connect to a remote browser via `browserless/chromium` endpoint
- The cron endpoint triggers API calls, which connect to Browserless for Playwright operations
- Craigslist subagent (cheerio-only) runs directly on Vercel

**Option B: Separate Worker (Railway/Fly.io/Dedicated VPS)**
- Deploy the subagents as a separate microservice on a platform that supports persistent processes
- Expose an HTTP API that the Vercel cron endpoint calls
- Subagent microservice handles Playwright, browser management, and returns results

**Option C: Hybrid (Recommended for MVP)**
- Craigslist subagent runs directly in the Vercel API route (no browser needed, cheerio-only)
- Facebook and AutoTempest subagents are refactored to use Browserless.io
- If Browserless is not configured, those sources are skipped with a clear log message

### 6.4 Locking & Concurrency

Each subagent source uses a Redis lock to prevent concurrent sweeps for the same source:

```typescript
async function acquireSourceLock(source: string, sweepId: string): Promise<boolean> {
  const lockKey = `scraper:lock:${source}`;
  const result = await kv.set(lockKey, sweepId, { nx: true, ex: 300 }); // 5 min TTL
  return result === 'OK';
}

async function releaseSourceLock(source: string): Promise<void> {
  await kv.del(`scraper:lock:${source}`);
}
```

### 6.5 Cron Monitoring

- Each sweep logs start/end times and errors to Redis
- The `/sweeps` admin page shows sweep history
- Failed sweeps show the error message
- Optionally: webhook notification (Discord/Slack) on sweep failure

---

## 7. Implementation Phases

### Phase 1: Core API & Redis (Week 1)
1. Define TypeScript types for scraped results, sweeps, schedule
2. Create Redis schema helpers (`src/lib/scraper-store.ts`):
   - `saveVehicleResult(source, data)`
   - `getVehicleResults(source, opts)`
   - `createSweep(sweepId, opts)`
   - `updateSweep(sweepId, status)`
   - `getSweep(sweepId)`
   - `getSweepsList()`
   - URL deduplication logic
3. Create API routes:
   - `POST /api/scrape/sweep` (stub — just creates sweep record)
   - `GET /api/scrape/sweep/[sweepId]`
   - `GET /api/scrape/results`
4. Refactor subagents:
   - Extract core logic from `fb_subagent.ts` into `src/lib/scrapers/facebook.ts` (implements `Scraper` interface, adds vision + lemon)
   - Extract core logic from `cl_subagent.ts` — already mostly covered by `src/lib/scrapers/craigslist.ts`, add lemon filter
   - Extract core logic from `at_subagent.ts` into `src/lib/scrapers/autotempest-vision.ts`
   - Each subagent becomes a function: `sweepFacebook(maxVehicles, filters): Promise<ScrapedVehicle[]>`
   - Results are saved to Redis instead of local JSON files

### Phase 2: Frontend Wiring (Week 2)
4. Build `MarketSweepPanel.tsx` component
5. Wire into `page.tsx` Quick Import section
6. Update `/fleet` page with "Import from Sweep" functionality
7. Update `/analytics` page with real scraped data charts
8. Build `/sweeps` admin page
9. Build `ScrapedVehicleCard` component

### Phase 3: CSV & Scheduling (Week 3)
10. Build `GET /api/scrape/export` with CSV generation
11. Build `POST /api/scrape/schedule` and `GET /api/scrape/schedule`
12. Build `GET /api/cron/sweep` endpoint
13. Configure Vercel Cron Job
14. Add Browserless.io integration for Facebook/AutoTempest subagents
15. End-to-end testing of automated sweeps

---

## 8. Key Design Decisions

| Decision | Rationale |
|---|---|
| Redis as primary store (not DB) | Already integrated, low latency, TTL support for auto-expiry, ZSET for time-sorted results, aligns with existing architecture |
| Separate `scraper:` prefix | Avoids collision with `vera_fleet_prod`, `antigravity:*`, and rate-limit keys |
| 30-day TTL on results | Vehicle listings are time-sensitive; old data is stale. TTL auto-cleans storage |
| URL-based deduplication | Prevents the same listing from appearing multiple times across sweeps |
| ZSET + HASH pattern (not LIST) | Enables efficient range queries by timestamp, source filtering, and pagination |
| Browserless.io for Playwright sources | Vercel serverless can't run Chromium; Browserless is a managed, affordable solution (~$10/mo) |
| Fire-and-forget sweep execution | Sweeps take 60-180 seconds (too long for synchronous HTTP); 202 Accepted + polling is the standard pattern |
| Cron via Vercel (not in-app setInterval) | No persistent server in serverless; Vercel Cron is free and reliable |

---

## 9. File Changes Summary

### New Files
```
src/lib/scraper-store.ts            ← Redis helpers for scraper storage
src/lib/scrapers/facebook.ts        ← Facebook Marketplace scraper (extracted from fb_subagent.ts)
src/lib/scrapers/lemon-filter.ts    ← Shared lemon detection (Gemini text prompt, used by CL + re-usable)
src/app/api/scrape/sweep/route.ts   ← POST sweep trigger
src/app/api/scrape/sweep/[id]/route.ts ← GET sweep status/results
src/app/api/scrape/results/route.ts ← GET paginated results
src/app/api/scrape/export/route.ts  ← GET CSV export
src/app/api/scrape/schedule/route.ts ← GET/POST schedule config
src/app/api/cron/sweep/route.ts     ← Vercel Cron handler
src/app/sweeps/page.tsx             ← Sweep history/management page
src/components/MarketSweepPanel.tsx ← Main sweep UI component
src/components/ScrapedVehicleCard.tsx ← Reusable result card
```

### Modified Files
```
src/lib/scrapers/index.ts           ← Add FacebookScraper to registry
src/lib/scrapers/craigslist.ts      ← Add lemon filter call after scrape
src/lib/scrapers/types.ts           ← Add lemonStatus, sellerType to ScrapedVehicle
src/app/page.tsx                    ← Add MarketSweepPanel import + usage
src/app/fleet/page.tsx              ← Add "Import from Sweep" functionality
src/app/analytics/page.tsx          ← Wire to real scraped data
vercel.json                         ← Add cron job config
```

### Files That Can Be Archived (No Longer Needed as Standalone Scripts)
```
scripts/fb_subagent.ts              ← Core logic extracted to src/lib/scrapers/facebook.ts
scripts/cl_subagent.ts              ← Core logic extracted to src/lib/scrapers/craigslist.ts
scripts/at_subagent.ts              ← Core logic extracted to src/lib/scrapers/autotempest-vision.ts
```

---

## 10. Open Questions / Risks

1. **Facebook anti-bot**: Facebook aggressively blocks automated access. Headful browser + stealth plugin helps but may not be sufficient long-term. Consider rotating residential proxies if blocks become frequent.

2. **Gemini API cost**: Each vision extraction call costs ~$0.0025-0.01 depending on image size. A 25-vehicle sweep × 3 sources = up to 75 vision calls = ~$0.50/sweep. At 4 sweeps/day = ~$60/month in Gemini costs alone. Consider:
   - Adding a cheaper OCR pass before Gemini (extract text first, only use vision if text insufficient)
   - Batching multiple listing screenshots into a single Gemini request
   - Caching extraction results by URL

3. **Vercel function timeout**: Vercel Pro allows 60s max (300s for Enterprise). Sweeps may exceed this. The "202 Accepted + polling" pattern handles this, but each subagent call must complete within the function timeout. If individual subagents take >60s, split them into per-listing API calls.

4. **Browserless.io cost**: If using the Browserless.io service, factor in their pricing (~$10/mo for 1000 sessions). Alternative: run your own browser instance on a cheap VPS.

5. **Craigslist rate limiting**: CL aggressively blocks IPs that make too many requests. The existing 1.5s delay between requests helps; consider increasing to 2-3s for production sweeps.
