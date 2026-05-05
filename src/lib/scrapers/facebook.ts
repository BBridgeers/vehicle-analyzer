import { Scraper, ScrapedVehicle } from './types';

// VPS Scraper API base URL — same as sweep route uses
const VPS_SCRAPER_URL = process.env.VPS_SCRAPER_URL || 'http://localhost:8765';

/**
 * Facebook Marketplace Scraper — delegates to VPS stealth browser.
 * FB pages are JS-rendered and aggressively anti-bot, so we can't
 * scrape them from Vercel serverless. The heavy lifting happens on
 * the VPS where we run real Chromium + stealth patches + session cookies.
 */
export class FacebookMarketplaceScraper implements Scraper {
    canHandle(url: string): boolean {
        // Match any Facebook Marketplace URL
        return /facebook\.com\/marketplace\/item\/\d+/i.test(url)
            || /fb\.watch|facebook\.com\/share/i.test(url);
    }

    async scrape(url: string): Promise<ScrapedVehicle> {
        console.log(`[FB Scraper] Delegating to VPS: ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

        try {
            const resp = await fetch(`${VPS_SCRAPER_URL}/api/scrape/detail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    session_id: 'default',
                }),
                signal: controller.signal,
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
                throw new Error(err.error || `VPS scraper returned ${resp.status}`);
            }

            const data = await resp.json();

            if (!data.success || !data.listing) {
                throw new Error(data.error || 'VPS scraper returned empty result');
            }

            const L = data.listing;
            console.log(`[FB Scraper] Got listing: ${L.title || `${L.make} ${L.model}`}, $${L.price}`);

            // Map VPS fields to ScrapedVehicle — ALL 35 fields
            const vehicle: ScrapedVehicle = {
                // Core Identity
                title: L.title || '',
                year: L.year ? Number(L.year) : undefined,
                make: L.make || '',
                model: L.model || '',
                trim: L.trim || '',
                price: L.price ? Number(L.price) : undefined,
                mileage: L.mileage ? Number(L.mileage) : undefined,
                vin: L.vin || undefined,
                location: L.location || '',
                sourceUrl: L.sourceUrl || url,
                source: 'facebook',

                // Listing Context
                description: L.description || '',
                postedDate: L.postedDate || '',
                titleStatus: L.titleStatus || '',
                images: L.images || [],

                // Specifications
                bodyStyle: L.bodyStyle || '',
                transmission: L.transmission || '',
                fuelType: L.fuelType || '',
                drivetrain: L.drivetrain || '',
                engine: L.engine || '',
                cylinders: L.cylinders ? Number(L.cylinders) : undefined,
                exteriorColor: L.exteriorColor || '',
                interiorColor: L.interiorColor || '',
                seats: L.seats ? Number(L.seats) : undefined,
                seatCount: L.seats ? Number(L.seats) : undefined,
                mpg: L.mpg || '',

                // Condition
                condition: L.condition || '',
                conditionExterior: L.conditionExterior || '',
                conditionInterior: L.conditionInterior || '',
                conditionMechanical: L.conditionMechanical || '',

                // Extended
                safetyRating: L.safetyRating || '',
                numOwners: L.numOwners ? Number(L.numOwners) : undefined,
                paidOff: L.paidOff || false,

                // Seller Intel
                sellerName: L.sellerName || '',
                sellerRedFlags: L.sellerRedFlags || '',
                sellerQuotes: L.sellerQuotes || '',
            };

            return vehicle;
        } finally {
            clearTimeout(timeout);
        }
    }
}
