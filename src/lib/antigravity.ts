import { Redis } from '@upstash/redis';
import { kv } from './kv';
import { VisionManager } from './vision-engine';

// Upstash Redis automatically uses KV_REST_API_URL and KV_REST_API_TOKEN from env
let redis: Redis | null = null;
try {
    redis = kv as unknown as Redis; // local SQLite store (Upstash retired)
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

            // Keep the COMPLETE decoded variable map — nothing discarded.
            (this.data as any).specsRaw = specs;
            const fuelPrimary = specs['Electrification Level'] && /PHEV|BEV|HEV/i.test(specs['Electrification Level'])
                ? (specs['Electrification Level'] as string)
                : (specs['Fuel Type - Primary'] || '');
            this.data.specs = {
                year, make, model, trim: specs.Trim || "",
                bodyStyle: specs['Body Class'] || "",
                engine: [specs['Displacement (L)'] ? specs['Displacement (L)'] + 'L' : '', specs['Engine Number of Cylinders'] ? specs['Engine Number of Cylinders'] + '-cyl' : '', specs['Engine Model']].filter(Boolean).join(' ') || specs['Engine Model'] || "",
                drivetrain: specs['Drive Type'] || "",
                transmission: [specs['Transmission Style'], specs['Transmission Speeds']].filter(Boolean).join(' ') || "",
                fuelType: fuelPrimary,
                seats: specs['Seats'] || "",
                doors: specs['Doors'] || "",
                exteriorColor: specs['Exterior Color'] || "",
                interiorColor: specs['Interior Color'] || "",
                plantCountry: specs['Plant Country'] || "",
                plantCity: specs['Plant City'] || "",
                vehicleType: specs['Vehicle Type'] || "",
                electrification: specs['Electrification Level'] || "",
                cylinders: specs['Engine Number of Cylinders'] || "",
                displacementL: specs['Displacement (L)'] || "",
                brakeSystem: specs['Brake System Type'] || "",
                steeringLocation: specs['Steering Location'] || "",
                seatBeltType: specs['Seat Belt Type'] || "",
                curtainAirbags: specs['Curtain Air Bag Locations'] || "",
                engineInfo: specs['Other Engine Info'] || "",
                series: specs['Series'] || "",
                gvwr: specs['Gross Vehicle Weight Rating From'] || "",
            };

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

            // ── NHTSA owner complaints (free, public) ──
            try {
                const cRes = await fetch(`https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`);
                const cData = await cRes.json();
                const list = cData.results || [];
                const comps = Array.from(new Set(list.map((c: any) => c.components).filter(Boolean)));
                (this.data.safety as any).complaints = {
                    count: list.length,
                    components: comps.slice(0, 10),
                    latest: list.slice(0, 5).map((c: any) => ({ date: c.dateComplaint, components: c.components, summary: String(c.summary || '').slice(0, 300), crash: c.crash, fire: c.fire })),
                };
            } catch (e) {
                (this.data.safety as any).complaints = { count: 0, components: [], latest: [] };
            }

            // ── NHTSA NCAP safety ratings (free, public) ──
            try {
                const sRes = await fetch(`https://api.nhtsa.gov/SafetyRatings/vehicle/${encodeURIComponent(year)}/${encodeURIComponent(make)}/${encodeURIComponent(model)}`);
                const sData = await sRes.json();
                const v = (sData.Results || [])[0];
                if (v && v.VehicleId) {
                    const rRes = await fetch(`https://api.nhtsa.gov/SafetyRatings/vehicleId/${v.VehicleId}`);
                    const rData = await rRes.json();
                    const r = (rData.Results || [])[0] || {};
                    (this.data.safety as any).ratings = {
                        source: 'NHTSA NCAP', overall: r.OverallRating || null,
                        frontal: r.OverallFrontCrashRating || null, side: r.OverallSideCrashRating || null,
                        rollover: r.RolloverRating || null, vehicleId: v.VehicleId, description: v.VehicleDescription || '',
                    };
                } else {
                    (this.data.safety as any).ratings = null;
                }
            } catch (e) {
                (this.data.safety as any).ratings = null;
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
        const SCRAPE_HOST = 'www.vehiclehistory.com';
        try {
            // ── Guard 1: target must have DNS. vehiclehistory.com is a dead domain
            // (NXDOMAIN globally) — bail instantly instead of blocking the VIN verdict.
            const dns = require('dns');
            await new Promise<void>((resolve, reject) => {
                dns.lookup(SCRAPE_HOST, (err: any) => (err ? reject(err) : resolve()));
            });

            // ── NOTE: playwright-extra + puppeteer-extra-plugin-stealth is a MISMATCHED
            // plugin family (those hooks belong to puppeteer, not playwright) and hangs
            // launch() indefinitely. Plain playwright-core launches in ~33ms. Never
            // reintroduce that pairing.
            const { chromium } = require('playwright-core');
            const chromiumArgs = require('@sparticuz/chromium');

            const launchPromise = chromium.launch({
                args: [...chromiumArgs.args, '--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
                defaultViewport: chromiumArgs.defaultViewport,
                executablePath: await chromiumArgs.executablePath(),
                headless: true,
            });

            // ── Guard 2: hard cap on launch so it can never hang an HTTP request.
            browser = await Promise.race([
                launchPromise,
                new Promise<never>((_, rej) => setTimeout(() => rej(new Error('browser launch timeout (20s)')), 20000)),
            ]);

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
                    (this.data.history as any).maintenanceAvailable = true;
                } else {
                    this.data.history.maintenance = [];
                }

            } catch (scrapeError) {
                // Catches the 30000ms timeout or a blocked page
                this.data.history.maintenance = [{ error: "History source timed out or blocked." }];
            (this.data.history as any).maintenanceAvailable = false;
            } finally {
                await page.close();
            }
        } catch (launchError) {
            console.error("Browser launch error:", launchError);
            this.data.history.maintenance = [{ error: "No free maintenance source available (vehiclehistory.com is offline). Service records come from the CARFAX report when present." }];
            (this.data.history as any).maintenanceAvailable = false;
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
            this.data.verdict.alerts.push(`${recalls} NHTSA recall campaign${recalls > 1 ? 's' : ''} on record — verify remedies performed`);
        }

        const maintCount = this.data.history.maintenance.length;
        if (maintCount > 0 && !this.data.history.maintenance[0]?.error) {
            score += 10;
        }

        this.data.verdict.score = Math.max(0, Math.min(100, score));
        this.data.verdict.recommendation = score > 75 ? "GREAT" : score > 50 ? "FAIR" : "CAUTION";
        (this.data.verdict as any).basis = 'NHTSA baseline (VIN-only). Not a substitute for a full history report — CARFAX history overrides this when present.';
        (this.data.verdict as any).recallNote = recalls > 0
            ? 'NHTSA lists campaigns for this year/make/model; whether the remedy was performed on THIS vehicle requires the history report.'
            : 'No recall campaigns on record for this year/make/model.';

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

    async processVisionInput(dataUrl: string) {
        const manager = new VisionManager({
            groqKey: process.env.GROQ_API_KEY,
            ollamaHost: process.env.OLLAMA_HOST
        });

        const prompt = `Extract vehicle details from this listing screenshot. Return JSON with: vin, year, make, model, price, mileage.`;
        const result = await manager.extract(dataUrl, prompt);

        return {
            vin: result?.vin || null,
            year: result?.year || null,
            make: result?.make || null,
            model: result?.model || null,
            price: result?.price || null,
            mileage: result?.mileage || null,
        };
    }

    static async getComparison(vins: string[]) {
        if (!redis) return [];
        const reports = await Promise.all(vins.map(vin => redis!.get(vin.toUpperCase())));
        return reports.filter(Boolean);
    }
}
