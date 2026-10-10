/**
 * Generic listing scraper — the "any source" fallback.
 * Order of extraction: JSON-LD (Product/Vehicle/Offer) -> OpenGraph/product meta -> heuristics from title + body.
 * Registered LAST so site-specific scrapers win.
 */
import * as cheerio from 'cheerio';
import { Scraper, ScrapedVehicle } from './types';
import { fetchWithHeaders, extractJsonLd, parseVehicleTitle, extractVin, extractMileage } from './utils';

export class GenericScraper implements Scraper {
    canHandle(url: string): boolean {
        return /^https?:\/\//i.test(url);
    }

    async scrape(url: string): Promise<ScrapedVehicle> {
        const html = await fetchWithHeaders(url);
        const $ = cheerio.load(html);
        const meta = (prop: string): string =>
            ($(`meta[property="${prop}"]`).attr('content') ||
                $(`meta[name="${prop}"]`).attr('content') || '').trim();

        const ld = extractJsonLd(html) || {};

        // ── Title ──
        const rawTitle = String(
            ld.name || ld.headline || meta('og:title') || $('title').text() || ''
        ).trim();
        const title = rawTitle.replace(/\s*[|\-–]\s*(craigslist|facebook marketplace|autotempest|ebay|offerup|carvana|cars\.com|truecar).*$/i, '').trim();

        // ── Price ──
        const priceRaw =
            (ld.offers && (Array.isArray(ld.offers) ? ld.offers[0]?.price : ld.offers.price)) ||
            meta('product:price:amount') || meta('og:price:amount') || '';
        let price = Number(String(priceRaw).replace(/[^0-9.]/g, ''));
        if (!price || isNaN(price)) {
            const bodyPrice = ($('body').text().match(/\$\s?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,6})/) || [])[1];
            price = bodyPrice ? Number(bodyPrice.replace(/,/g, '')) : NaN;
        }
        price = isNaN(price) || price <= 0 ? null : Math.round(price);

        // ── Description ──
        const description = String(
            ld.description || meta('og:description') || meta('description') || ''
        ).replace(/\s+/g, ' ').trim().slice(0, 4000);

        // ── Images ──
        const ldImages = ld.image ? (Array.isArray(ld.image) ? ld.image : [ld.image]) : [];
        const images = [...ldImages, meta('og:image'), meta('og:image:secure_url')]
            .map(x => (typeof x === 'string' ? x : x?.url || ''))
            .filter((x: string) => !!x && /^https?:/.test(x))
            .slice(0, 10);

        // ── Vehicle identity ──
        const parsed = parseVehicleTitle(title);
        const pageText = $('body').text().replace(/\s+/g, ' ');
        const vin = ld.vehicleIdentificationNumber || extractVin(html) || undefined;
        const mileage = ld.mileageFromOdometer?.value
            ? Number(ld.mileageFromOdometer.value)
            : extractMileage(`${title} ${description}`);

        const specText = `${title} ${description}`;
        const grab = (re: RegExp) => (specText.match(re) || [])[1]?.trim() || undefined;

        if (!parsed.year && !price && !vin) {
            // Nothing vehicle-shaped found — tell the user clearly instead of storing junk.
            throw new Error(
                `Could not identify a vehicle on that page (title: "${title.slice(0, 80)}"). Paste a single vehicle listing, not a search/results page.`
            );
        }

        return {
            title,
            price,
            mileage,
            vin,
            year: parsed.year,
            make: parsed.make,
            model: parsed.model,
            trim: parsed.trim,
            description,
            images,
            sourceUrl: url,
            source: 'generic',
            exteriorColor: grab(/\b(black|white|silver|gray|grey|blue|red|green|brown|gold|beige|orange|yellow|maroon)\b/i),
            transmission: grab(/\b(automatic|manual|cvt|6-speed|5-speed|8-speed)\b/i),
            fuelType: grab(/\b(gasoline|gas|diesel|hybrid|plug-in hybrid|electric|flex fuel)\b/i),
            drivetrain: grab(/\b(fwd|rwd|awd|4wd|4x4|front-wheel drive|rear-wheel drive|all-wheel drive)\b/i),
            bodyStyle: grab(/\b(sedan|coupe|hatchback|suv|truck|pickup|wagon|minivan|convertible)\b/i),
            engine: grab(/(\d\.\d\s?L\s?(?:V\d|I\d|inline-\d|4-cyl|6-cyl|8-cyl)?)/i),
            condition: grab(/\b(excellent|very good|good|fair|rough)\s+condition\b/i),
            pageTextLength: pageText.length,
        } as ScrapedVehicle;
    }
}
