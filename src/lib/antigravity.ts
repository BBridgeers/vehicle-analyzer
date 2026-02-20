import { Redis } from '@upstash/redis';

// Note: Upstash Redis automatically uses KV_REST_API_URL and KV_REST_API_TOKEN from env
let redis: Redis | null = null;
try {
    redis = Redis.fromEnv();
} catch (e) {
    console.warn("Redis not configured, caching will be disabled.");
}

const cleanMake = (rawMake: string): string => {
    return rawMake
        .replace(/\b(CORP|CORPORATION|INC|LLC|MOTOR|CO|COMPANY|NORTH AMERICA|USA|GROUP|HOLDINGS)\b/gi, '')
        .trim()
        .split(' ')[0] // Captures the primary brand name
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
};

export class AntigravityEngine {
    private vin: string;
    public data: any;

    constructor(vin: string) {
        this.vin = vin.toUpperCase();
        this.data = {
            meta: { vin: this.vin, timestamp: Date.now() },
            specs: { year: "Unknown", make: "Unknown", model: "Unknown", trim: "" },
            safety: { recalls: [] },
            history: { maintenance: [] },
            verdict: { score: 100, alerts: [], recommendation: "UNKNOWN" }
        };
    }

    // --- CACHE LAYER (Upstash Redis) ---
    async checkCache() {
        if (!redis) return null;
        try {
            const cachedData = await redis.get<any>(this.vin);
            if (cachedData) {
                console.log(`[✓] Warm KV Cache Hit for ${this.vin}`);
                return cachedData;
            }
            return null;
        } catch (e) {
            console.error("KV Read Error:", e);
            return null;
        }
    }

    async saveCache() {
        if (!redis) return;
        try {
            // ex: 604800 enforces the exact 7-Day TTL requirement via Redis
            await redis.set(this.vin, this.data, { ex: 604800 });
        } catch (e) {
            console.error("KV Cache Write Error:", e);
        }
    }

    // --- STEP 1: NHTSA DATA (Fast APIs) ---
    async fetchFastAPIs() {
        try {
            const decodeRes = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${this.vin}?format=json`);
            if (!decodeRes.ok) throw new Error("NHTSA vPIC Down");
            const decodeData = await decodeRes.json();

            const specs: any = {};
            decodeData.Results.forEach((i: any) => { if (i.Value) specs[i.Variable] = i.Value; });

            const rawMake = specs.Make || "";
            let make = cleanMake(rawMake);
            const model = specs.Model || "";
            const year = specs['Model Year'] || "";

            // Special Case Mapping
            if (make.toLowerCase() === "fca" || make.toLowerCase() === "stellantis") make = "Chrysler/Jeep";
            if (make.toLowerCase() === "volkswagen group") make = "Volkswagen";

            this.data.specs = { year, make, model, trim: specs.Trim || "" };

            try {
                const recallRes = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`);
                const recallData = await recallRes.json();

                const recalls = recallData.results || [];
                // Align schema
                this.data.safety.recalls = recalls.map((r: any) => {
                    const summary = r.Summary || "";
                    const isCritical = /Fire|Stall|Brakes|Do Not Drive/i.test(summary) || /Fire|Stall|Brakes|Do Not Drive/i.test(r.Notes || "");
                    return {
                        recall_id: r.NHTSACampaignNumber,
                        affected_component: r.Component,
                        description: summary,
                        remedy_action: r.Remedy,
                        is_critical: isCritical
                    };
                }).filter((r: any) => r.affected_component !== "UNKNOWN");

            } catch (recallError) {
                this.data.safety.recalls = []; // Safe fallback
            }

        } catch (e) {
            console.error("Critical API Error:", e);
            // Failsafe state
            this.data.specs = { year: "Unknown", make: "Unknown", model: "Unknown", trim: "" };
        }
    }

    // --- STEP 2: MAINTENANCE SCRAPE (Surgical Scrape) ---
    async scrapeMaintenance() {
        let browser;
        try {
            // Use playwright-extra with puppeteer-extra-plugin-stealth
            const { chromium: playwright } = require('playwright-extra');
            const stealth = require('puppeteer-extra-plugin-stealth');
            playwright.use(stealth());

            if (process.env.NODE_ENV === 'development' || process.platform === 'win32') {
                browser = await playwright.launch({
                    channel: 'chrome',
                    headless: true
                });
            } else {
                const chromiumArgs = require('@sparticuz/chromium');
                browser = await playwright.launch({
                    args: [...chromiumArgs.args, '--disable-blink-features=AutomationControlled'],
                    defaultViewport: chromiumArgs.defaultViewport,
                    executablePath: await chromiumArgs.executablePath(),
                    headless: chromiumArgs.headless,
                });
            }

            const page = await browser.newPage();

            try {
                // Strict 30-second timeout enforced here (Vercel Pro)
                await page.goto(`https://www.vehiclehistory.com/vin-report/${this.vin}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                // specifically target and click a[data-target="#service-history"], then waitForTimeout(1500)
                const tab = page.locator('a[data-target="#service-history"]');
                if (await tab.isVisible()) {
                    await tab.click();
                    await page.waitForTimeout(1500);
                }

                // Extract history
                const items = await page.locator('.timeline-item').all();
                const historyEvents = [];
                for (const item of items) {
                    const date = await item.locator('.service-history-date').innerText().catch(() => "");
                    const mileageRaw = await item.locator('.service-history-mileage').innerText().catch(() => "");
                    const description = await item.locator('.service-history-description').innerText().catch(() => "");

                    const mileage = parseInt(mileageRaw.replace(/[^0-9]/g, ''), 10) || null;
                    if (date || description) {
                        historyEvents.push({ date, mileage, description });
                    }
                }

                if (historyEvents.length > 0) {
                    this.data.history.maintenance = historyEvents;
                } else {
                    this.data.history.maintenance = [];
                }

            } catch (scrapeError) {
                // Catches the 30000ms timeout or a blocked page
                this.data.history.maintenance = [{ error: "History unavailable - Timeout or Blocked" }];
            } finally {
                await page.close();
            }
        } catch (launchError) {
            console.error("Browser launch error:", launchError);
            this.data.history.maintenance = [{ error: "Browser failed to launch" }];
        } finally {
            if (browser) await browser.close();
        }
    }

    // --- STEP 3: THE VERDICT ---
    generateVerdict() {
        let score = 100;
        const recalls = this.data.safety.recalls.length;

        if (recalls > 0) {
            score -= (recalls * 15);
            this.data.verdict.alerts.push(`${recalls} Open Recalls`);
        }

        const maintCount = this.data.history.maintenance.length;
        if (maintCount > 0 && !this.data.history.maintenance[0]?.error) {
            score += 10;
        }

        this.data.verdict.score = Math.max(0, Math.min(100, score));
        this.data.verdict.recommendation = score > 75 ? "GREAT" : score > 50 ? "FAIR" : "CAUTION";

        return this.data;
    }

    async runAnalysis() {
        const cached = await this.checkCache();
        if (cached) {
            this.data = cached;
            return this.data;
        }

        await this.fetchFastAPIs();
        await this.scrapeMaintenance();
        this.generateVerdict();

        await this.saveCache();
        return this.data;
    }

    static async getComparison(vins: string[]) {
        if (!redis) return [];
        const reports = await Promise.all(vins.map(vin => redis!.get(vin.toUpperCase())));
        return reports.filter(Boolean);
    }
}
