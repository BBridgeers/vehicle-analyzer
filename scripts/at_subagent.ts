import { chromium } from 'playwright-extra';
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables for local testing
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
    envConfig.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) process.env[key.trim()] = val.trim();
    });
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GeminiKey;
if (!apiKey) {
    console.error('CRITICAL: GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// ── CONSTANTS ──
// AutoTempest: Dallas ZIP (75201), 50mi Radius, Max $7k, Max 100k miles, Clean Title, Min Year 2006
const AT_SEARCH_URL = "https://www.autotempest.com/results?zip=75201&radius=50&minyear=2006&maxprice=7000&maxmiles=100000&title=clean";
const MAX_SCRAPES = 5; // How many external referral links to scrape

const EXTRACTION_PROMPT = `You are a universal vehicle listing data extraction engine. Analyze this screenshot of a vehicle listing (zoomed to 50% to capture maximum data) from a random dealership or aggregator site. Extract all visible information.

CRITICAL TASK: Lemon Detection
Evaluate the Year, Make, and Model. If this specific powertrain or generation is widely known in the automotive industry to have catastrophic mechanical failures, class-action lawsuits, or "lemon-esque" reliability (e.g., Nissan CVT transmissions, Ford Powershift, early Hyundai Theta II, Chevy Trax turbos, BMW N63 valve seals, etc.), you MUST mark "isLemon" as true and provide the precise engineering reason.

Return ONLY valid JSON:
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
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: imageBuffer.toString('base64'),
                    },
                },
                { text: EXTRACTION_PROMPT }
            ],
            config: { temperature: 0.1 }
        });

        const text = response.text || "{}";
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(jsonStr);
    } catch (e: any) {
        console.error("   ⚠️ Gemini Extraction Error:", e.message);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting AutoTempest Subagent...");
    console.log(`📡 Target Search: ${AT_SEARCH_URL}`);

    const browser = await chromium.launch({ headless: false }); // Show browser for human oversight
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1080 }
    });
    
    const page = await context.newPage();

    // 1. Navigate to Search Page
    console.log("   🔍 Navigating to AutoTempest search...");
    await page.goto(AT_SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // AutoTempest requires solving Cloudflare sometimes or waiting for the results API to inject DOM.
    console.log("   ⏳ Waiting 5 seconds for aggregator results to populate...");
    await new Promise(r => setTimeout(r, 5000));

    // Scroll down to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 2000));

    // 2. Extract Referral Links
    // AutoTempest listings usually have classes like .result-wrap or .listing-link
    const links = await page.evaluate(() => {
        // Collect links that go to external sites like cars.com, truecar, etc via Autotempest tracker
        const items = document.querySelectorAll('a.listing-link');
        const urls = Array.from(items).map(a => (a as HTMLAnchorElement).href);
        return [...new Set(urls)].filter(url => !url.includes('autotempest.com/go/'));
    });

    console.log(`✅ Found ${links.length} potential external vehicles. Testing first ${MAX_SCRAPES}...`);

    const results = [];

    for (let i = 0; i < Math.min(links.length, MAX_SCRAPES); i++) {
        const url = links[i];
        console.log(`\n🔍 Scraping [${i+1}/${MAX_SCRAPES}]: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await new Promise(r => setTimeout(r, 4000)); // allow popups/overlays to load so they can be ignored or closed

            // Zoom out to 50% to capture Universal Data
            console.log("   Applying 50% universal magnification...");
            await page.evaluate(() => {
                document.body.style.zoom = "50%";
            });
            await new Promise(r => setTimeout(r, 1500)); // Ensure render

            // Take Full Page Screenshot
            console.log("   📸 Capturing Universal Listing Screenshot...");
            const screenshotBuffer = await page.screenshot({ fullPage: true });

            // Send to Gemini
            console.log("   🧠 Sending to Universal AI Extractor (with Lemon Filter)...");
            const data = await extractListingData(screenshotBuffer);

            if (data) {
                console.log(`   📊 Result: ${data.year} ${data.make} ${data.model} - $${data.price}`);
                
                if (data.year && data.year < 2006) {
                    console.log(`   ❌ AGE REJECTED: ${data.year} is older than the 2006 minimum cutoff.`);
                } else if (data.lemonStatus?.isLemon) {
                    console.log(`   🔴 LEMON REJECTED: ${data.lemonStatus.reason}`);
                } else if (data.sellerType && data.sellerType.toLowerCase().includes('dealer')) {
                    console.log(`   ❌ DEALER REJECTED: AutoTempest often surfaces dealers. Only private owners allowed.`);
                } else {
                    console.log(`   ✅ PASSED: Golden Vehicle candidate!`);
                    results.push({ url, ...data });
                }
            }
        } catch (e: any) {
            console.log(`   ❌ Error scraping destination ${url}: ${e.message}`);
        }
    }

    console.log("\n=== FINAL GOLDEN VEHICLES ===");
    console.log(`Found ${results.length} valid vehicles from AutoTempest.`);
    
    fs.writeFileSync('at_golden_vehicles.json', JSON.stringify(results, null, 2));
    console.log("\n💾 Saved to 'at_golden_vehicles.json' for easier review.");

    await browser.close();
}

run().catch(console.error);
