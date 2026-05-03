import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { fetchWithHeaders } from '../src/lib/scrapers/utils';
import { scrapeVehicle } from '../src/lib/scrapers/index';

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
if (!groqKey) {
    console.error('CRITICAL: GROQ_API_KEY environment variable is missing.');
    process.exit(1);
}

// ── CONSTANTS ──
// DFW Metroplex, Max $7000, Max 100k miles, Title: Clean, By Owner, Min Year 2006
const CL_SEARCH_URL = "https://dallas.craigslist.org/search/cta?min_auto_year=2006&max_price=7000&max_auto_miles=100000&auto_title_status=1&purveyor=owner";
const MAX_SCRAPES = 25; // How many deep links to jump into per execution

const LEMON_PROMPT = `You are a vehicle validation engine. Review the following vehicle Make, Model, Year, and Description.
CRITICAL TASK: Lemon Detection
If this specific powertrain or generation is widely known in the automotive industry to have catastrophic mechanical failures, class-action lawsuits, or "lemon-esque" reliability (e.g., Nissan CVT transmissions, Ford Powershift, early Hyundai Theta II engine, Chevy Trax turbos, BMW N63 valve seals, etc.), you MUST mark "isLemon" as true and provide the precise engineering reason.

Return ONLY valid JSON:
{
  "isLemon": <boolean>,
  "reason": "<string or null>"
}`;

async function runLemonFilter(year: number | undefined, make: string | undefined, model: string | undefined, description: string) {
    // If it's incredibly vague and we don't know the make/model, we pass it but log it
    if (!make || !model) return { isLemon: false, reason: null };

    const payload = `Vehicle: ${year || 'Unknown Year'} ${make} ${model}\nDescription: ${description.substring(0, 1000)}`;
    
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: LEMON_PROMPT },
                { role: 'user', content: payload }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' }
        });

        const content = response.data.choices[0].message.content;
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(jsonStr);
    } catch (e: any) {
        console.error("   ⚠️ Groq Lemon Filter Error (passed by default):", e.response?.data || e.message);
        return { isLemon: false, reason: null };
    }
}

async function run() {
    console.log("🚀 Starting Craigslist Subagent...");
    console.log(`📡 Target: ${CL_SEARCH_URL}`);

    // 1. Fetch Search Page
    const html = await fetchWithHeaders(CL_SEARCH_URL);
    const $ = cheerio.load(html);

    // 2. Extract Links
    const links: string[] = [];
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/d/') && href.endsWith('.html') && !href.includes('/reply/')) {
            links.push(href);
        }
    });

    const uniqueLinks = [...new Set(links)];

    console.log(`✅ Found ${uniqueLinks.length} potential vehicles. Processing up to ${MAX_SCRAPES}...`);

    const results = [];
    // Pause between requests to prevent temporary IP bans from CL
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < Math.min(uniqueLinks.length, MAX_SCRAPES); i++) {
        let url = uniqueLinks[i];
        
        console.log(`\n🔍 Scraping [${i + 1}/${MAX_SCRAPES}]: ${url}`);
        
        try {
            // Use existing factory
            const vehicle = await scrapeVehicle(url);
            
            console.log(`   📊 Result: ${vehicle.year || '????'} ${vehicle.make || 'Unknown'} ${vehicle.model || 'Unknown'} - $${vehicle.price}`);
            
            if (vehicle.year && vehicle.year < 2006) {
                console.log(`   ❌ AGE REJECTED: ${vehicle.year} is older than the 2006 minimum cutoff.`);
                // skip to next
            } else {
                // 3. Fast Text-Only AI Lemon Filter (Groq — free tier)
                console.log("   🧠 Running AI Lemon Validation...");
                const lemonStatus = await runLemonFilter(vehicle.year, vehicle.make, vehicle.model, vehicle.description || '');

                if (lemonStatus.isLemon) {
                    console.log(`   🔴 LEMON REJECTED: ${lemonStatus.reason}`);
                } else {
                    console.log(`   ✅ PASSED: Golden Vehicle candidate!`);
                    results.push({ ...vehicle, lemonStatus });
                }
            }
        } catch (e: any) {
            console.log(`   ❌ Error scraping ${url}: ${e.message}`);
        }

        // Anti-bot delay
        await delay(1500);
    }

    console.log("\n=== FINAL GOLDEN VEHICLES ===");
    console.log(`Found ${results.length} valid vehicles from Craigslist.`);

    fs.writeFileSync('cl_golden_vehicles.json', JSON.stringify(results, null, 2));
    console.log("\n💾 Saved to 'cl_golden_vehicles.json' for easier review.");
}

run().catch(console.error);
