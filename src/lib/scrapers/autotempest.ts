import * as cheerio from 'cheerio';
import { Scraper, ScrapedVehicle } from './types';
import { fetchWithHeaders } from './utils';

export class AutoTempestScraper implements Scraper {
    canHandle(url: string): boolean {
        return url.includes('autotempest.com');
    }

    async scrape(url: string): Promise<ScrapedVehicle> {
        // fetchWithHeaders might follow redirects. AutoTempest detail items often redirect.
        // We will fetch the HTML. If it is an AutoTempest page, we parse it.
        // If it redirected to an external site (Cars.com, TrueCar, etc.), we try a generic fallback extraction for now,
        // or just rely on the HTML content if it's still AutoTempest.

        const html = await fetchWithHeaders(url);
        const $ = cheerio.load(html);

        // Basic Extraction from AutoTempest Detail page ('abt-' sources)
        const title = $('h1').text().trim() || $('title').text().replace('- AutoTempest.com', '').trim();

        let price: number | null = null;
        let priceText = $('.price').text().trim() || $('.listing-detail-price').text().trim() || $('[itemprop="price"]').text().trim();
        if (priceText) {
            price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        }

        let mileage: number | null = null;
        let mileageText = $('.mileage').text().trim() || $('.listing-detail-mileage').text().trim();
        if (mileageText) {
            mileage = parseInt(mileageText.replace(/[^0-9]/g, ''), 10);
        }

        // Search for VIN via regex across the whole HTML body as a fallback
        let vin: string | undefined = undefined;
        // Basic VIN regex: [A-HJ-NPR-Z0-9]{17}
        const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/i;

        // Try specific spec blocks first
        $('.spec, .detail, dd, td').each((_, el) => {
            const text = $(el).text().trim();
            if (text.length >= 17) {
                const match = text.match(vinRegex);
                if (match) vin = match[1].toUpperCase();
            }
        });

        if (!vin) {
            // Check the entire body text
            const bodyText = $('body').text();
            const match = bodyText.match(vinRegex);
            if (match) {
                vin = match[1].toUpperCase();
            }
        }

        let year: number | undefined = undefined;
        let make: string | undefined = undefined;
        let model: string | undefined = undefined;

        // Try to parse year/make/model from title (e.g. "2023 Toyota Camry SE")
        if (title) {
            const yearMatch = title.match(/^(19|20)\d{2}/);
            if (yearMatch) {
                year = parseInt(yearMatch[0], 10);
            }

            const parts = title.replace(/^(19|20)\d{2}\s*/, '').split(' ');
            if (parts.length > 0) {
                make = parts[0]; // e.g., "Toyota"
                if (parts.length > 1) {
                    model = parts.slice(1).join(' '); // e.g., "Camry SE"
                }
            }
        }

        const images: string[] = [];
        $('img.listing-image, .gallery img, [itemprop="image"]').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && src.startsWith('http')) {
                images.push(src);
            }
        });

        // If it's a redirect to an external site, title might be something else entirely.
        // We'll return what we can. The VIN is the most critical piece.

        return {
            title,
            price,
            mileage,
            vin,
            year,
            make,
            model,
            description: title, // Detail pages lack full descriptions often
            images,
            sourceUrl: url,
            conditionExterior: undefined,
            conditionInterior: undefined,
            conditionMechanical: undefined
        };
    }
}
