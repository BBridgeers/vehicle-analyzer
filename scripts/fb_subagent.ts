import { chromium } from 'playwright-extra';
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Load environment variables for local testing
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
    envConfig.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) process.env[key.trim()] = val.trim();
    });
}

const groqKey = process.env.GROQ_API_KEY;
const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

import { VisionManager } from '../src/lib/vision-engine';
const visionManager = new VisionManager({
    groqKey: groqKey,
    ollamaHost: ollamaHost
});

// ── CONSTANTS ──
// DFW Metroplex, Max $7000 (Min $1000), Max 100k miles, Min Year 2006, Cars/Trucks/SUVs ONLY
const FB_SEARCH_URL = "https://www.facebook.com/marketplace/dallas/vehicles?minYear=2006&minPrice=1000&maxPrice=7000&maxMileage=100000&sortBy=creation_time_descend&vehicleTypes=car%2Ctruck%2Csuv%2Cvan%2Cminivan";
const MAX_SCRAPES = 25; // Process up to 25 vehicles per sweep

const EXTRACTION_PROMPT = `You are a vehicle listing data extraction engine. Analyze this Facebook Marketplace screenshot (zoomed to 50% to capture maximum data) and extract all visible information.

STEP 1 — VEHICLE TYPE GATE (MUST DO FIRST):
Determine if this listing is a passenger automobile (car, truck, SUV, van, minivan, crossover, or motorcycle). If the listing is for ANY of the following, return null immediately:
- Trailers (utility, horse, boat, cargo, car hauler)
- Farm/agricultural equipment (tractors, ATVs, skid steers)
- Boats, jet skis, RVs, golf carts, go-karts
- Commercial vehicles without a standard odometer (street sweepers, construction equipment)
If it is NOT a passenger automobile, return exactly: null

STEP 2 — LEMON DETECTION (only if passed Step 1):
Evaluate the Year, Make, and Model. If this specific powertrain or generation is widely known in the automotive industry to have catastrophic mechanical failures, class-action lawsuits, or "lemon-esque" reliability (e.g., Nissan CVT transmissions, Ford Powershift, early Hyundai Theta II, Chevy Trax turbos, BMW N63 valve seals, etc.), you MUST mark "isLemon" as true and provide the precise engineering reason.

Return ONLY valid JSON (or null):
{
  "year": <number>,
  "make": "<string>",
  "model": "<string>",
  "trim": "<string>",
  "price": <number>,
  "mileage": <number>,
  "titleStatus": "<Clean|Salvage|Rebuilt|Lien>",
  "sellerType": "<Private|Dealer>",
  "lemonStatus": {
    "isLemon": <boolean>,
    "reason": "<string or null>"
  },
  "description": "<string>",
  "conditionExterior": "<string>"
}`;

async function extractListingData(imageBuffer: Buffer) {
    return await visionManager.extract(imageBuffer, EXTRACTION_PROMPT);
}

async function run() {
    console.log("🚀 Starting Facebook Marketplace Subagent...");
    console.log(`📡 Target: ${FB_SEARCH_URL}`);

    const browser = await chromium.launch({ headless: false }); // Headless false initially to bypass extreme bot checks
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1080 }
    });

    const page = await context.newPage();

    // 0. Authenticate to Facebook (if credentials provided in .env.local)
    if (process.env.FB_EMAIL && process.env.FB_PASSWORD) {
        console.log("   🔑 Facebook credentials found. Logging in...");
        await page.goto("https://www.facebook.com/", { waitUntil: 'load', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000));

        try {
            await page.fill('input[name="email"]', process.env.FB_EMAIL);
            await new Promise(r => setTimeout(r, 500));
            await page.fill('input[name="pass"]', process.env.FB_PASSWORD);
            await new Promise(r => setTimeout(r, 500));
            await page.click('button[name="login"]');
        } catch (e) {
            console.log("   ⚠️ Login fields not found. Facebook might have blocked the IP or presented a captcha.");
            // Wait an extra moment to let user intervene manually since headless=false
            await new Promise(r => setTimeout(r, 10000));
        }

        // Wait for login to complete
        await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => { });
        console.log("   ✅ Login sequence check completed.");
    } else {
        console.log("   ⚠️ No FB_EMAIL or FB_PASSWORD found in .env.local. Proceeding unauthenticated (may be blocked by FB).");
    }

    // 1. Navigate to Search
    console.log("   🔍 Navigating to search page...");
    await page.goto(FB_SEARCH_URL, { waitUntil: 'load', timeout: 60000 });

    // Quick pause to mimic human loading
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to load a few items
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 2000));

    // Extract listing links
    const links = await page.evaluate(() => {
        const items = document.querySelectorAll('a[href*="/marketplace/item/"]');
        const urls = Array.from(items).map(a => (a as HTMLAnchorElement).href);
        return [...new Set(urls)]; // Remove duplicates
    });

    console.log(`✅ Found ${links.length} potential vehicles. Testing first ${MAX_SCRAPES}...`);

    const results = [];

    for (let i = 0; i < Math.min(links.length, MAX_SCRAPES); i++) {
        const url = links[i];
        console.log(`\n🔍 Scraping [${i + 1}/${MAX_SCRAPES}]: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'load', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Expand description if "See more" exists
            try {
                // Heuristic for FB Marketplace "See more" text
                const seeMoreBtn = page.locator('text="See more"').first();
                if (await seeMoreBtn.isVisible()) {
                    await seeMoreBtn.click();
                    await new Promise(r => setTimeout(r, 1000));
                }
            } catch (e) {
                // Ignore if no "See more"
            }

            // Zoom out to 50% to capture ALL data
            console.log("   Applying 50% magnification...");
            await page.evaluate(() => {
                document.body.style.zoom = "50%";
            });
            await new Promise(r => setTimeout(r, 1000)); // Ensure render

            // Take Full Page Screenshot
            console.log("   📸 Taking screenshot for vision analysis...");
            const screenshotBuffer = await page.screenshot({ fullPage: true });

            // Optionally save to disk for debugging
            // fs.writeFileSync(`screenshot_${i}.png`, screenshotBuffer);

            // Send to Vision Manager (Groq → Ollama fallback)
            console.log("   🧠 Sending to Vision Manager (with Lemon Filter)...");
            const data = await extractListingData(screenshotBuffer);

            if (data) {
                console.log(`   📊 Result: ${data.year} ${data.make} ${data.model} - $${data.price}`);

                if (data.year && data.year < 2006) {
                    console.log(`   ❌ AGE REJECTED: ${data.year} is older than the 2006 minimum cutoff.`);
                } else if (data.lemonStatus?.isLemon) {
                    console.log(`   🔴 LEMON REJECTED: ${data.lemonStatus.reason}`);
                } else if (data.sellerType?.toLowerCase().includes('dealer')) {
                    console.log(`   ❌ DEALER REJECTED: Only private owners allowed.`);
                } else {
                    console.log(`   ✅ PASSED: Golden Vehicle candidate!`);
                    results.push({ url, ...data });
                }
            }
        } catch (e: any) {
            console.log(`   ❌ Error scraping ${url}: ${e.message}`);
        }
    }

    console.log("\n=== FINAL GOLDEN VEHICLES ===");
    console.log(JSON.stringify(results, null, 2));

    fs.writeFileSync('golden_vehicles.json', JSON.stringify(results, null, 2));
    console.log("\n💾 Saved to 'golden_vehicles.json' for easier review.");

    await browser.close();
}

run().catch(console.error);
