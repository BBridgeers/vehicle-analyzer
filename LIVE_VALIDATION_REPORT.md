# Live Validation Audit — veracar.co

## LIVE TESTED MODALITIES

| # | Modality | Status | Notes |
|---|----------|--------|-------|
| 1 | VIN Decode | ✅ WORKS | 1HGCV1F34LA012345 → 2020 HONDA Accord, Score 40, 4 recalls |
| 2 | Market Sweep | ✅ WORKS | Craigslist scraping returns live results |
| 3 | Sweep → Analyze | ✅ WORKS | Loads Craigslist URL into evaluation form |
| 4 | History Item Click | ✅ WORKS | Loads vehicle data into form (2019 RAV4, 2016 Civic, 2021 Model 3) |
| 5 | Save to Fleet | ✅ WORKS | Saves to fleet, form stays populated |
| 6 | Clear Form | ✅ WORKS | Clears all form fields |
| 7 | Fleet Dashboard | ✅ WORKS | Displays 2 saved vehicles |
| 8 | Comparison Matrix | ✅ WORKS | 3 vehicles compared with full metrics |
| 9 | Market Analytics | ✅ WORKS | Full market heat index, trends, anomalies |

## BUTTONS TESTED

| Button | Status | Notes |
|--------|--------|-------|
| "Ask VERA" | ❌ NO FUNCTION | Just page refresh |
| "Run AI Analysis" | ❌ NO FUNCTION | Does nothing |
| "Generate VERA Intelligence Report" | ❌ NO FUNCTION | Just returns string |
| "Negotiation Script" | ❌ NO FUNCTION | Returns string, no export |
| "Full Intel Report" | ❌ NO FUNCTION | Just returns string, no export |
| "Scrape" (Listing URL) | ⚠️ VPS ISSUE | Returns "fetch failed" - VPS scraper timeout |
| "Scrape" (FB Marketplace) | ⚠️ VPS ISSUE | Returns 0 results - FB requires login |

## REPORTS/PDF/MARKDOWN EXPORT

| Report Type | Status | Reason |
|-------------|--------|--------|
| Full Intel Report | ❌ NOT FUNCTIONAL | No pdfmake/pdfkit installed - only returns string |
| Negotiation Script | ❌ NOT FUNCTIONAL | No export functionality |
| CSV Export | ✅ WORKS | Sweep page has functional CSV export |

## LIVE BUG SUMMARY

### CRITICAL (Data Loss)
- None identified after live testing

### HIGH (UX Broken)
1. **"Ask VERA"** - Chat button just refreshes page, no chat interface
2. **"Run AI Analysis"** - Button present but does nothing
3. **"Generate VERA Intelligence Report"** - Returns string, no PDF download
4. **"Negotiation Script"** - Returns negotiation text, no download/export
5. **"Full Intel Report"** - Returns string, no download/export
6. **Facebook Scrape** - Returns 0 results (requires login to FB)

### MEDIUM (Missing Features)
1. **PDF/Markdown Export** - Buttons exist but no file generation
2. **"Scrape" button "fetch failed"** - VPS scraper timeout on certain URLs

### VERIFIED WORKING
- VIN Decode: ✅ Full decode with NHTSA API
- Market Sweep: ✅ Craigslist scraping with results table
- History Items: ✅ Load vehicle data into form
- Save to Fleet: ✅ Saves without clearing form
- Clear Form: ✅ Clears all form fields
- Fleet Dashboard: ✅ Displays saved vehicles
- Comparison Matrix: ✅ Full comparison metrics
- Market Analytics: ✅ Live market data
- Export CSV: ✅ Works on sweep page

## COMMIT HISTORY
- `b742263` — docs: add 6 input modalities
- `e8a0a92` — multi-tenant KV wrapper, rate limiting
- `071cdb0` — comparison API route
