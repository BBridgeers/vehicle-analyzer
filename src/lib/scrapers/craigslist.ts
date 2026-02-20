import * as cheerio from 'cheerio';
import { Scraper, ScrapedVehicle } from './types';
import { fetchWithHeaders } from './utils';

export class CraigslistScraper implements Scraper {
    canHandle(url: string): boolean {
        return url.includes('craigslist.org');
    }

    async scrape(url: string): Promise<ScrapedVehicle> {
        const html = await fetchWithHeaders(url);
        const $ = cheerio.load(html);

        const title = $('#titletextonly').text().trim();
        const priceText = $('.price').first().text().trim();
        const price = priceText ? parseInt(priceText.replace(/[^0-9]/g, ''), 10) : null;

        // Extract Location from title suffix (e.g. " - (Dallas)") or nearby small tag
        let location = $('.postingtitletext small').text().trim().replace(/[()]/g, '');
        if (!location) {
            // Fallback: try to find it in the full title text if not in small tag
            // Often looks like: "2015 Toyota Camry - $11,500 (Dallas)"
            const fullTitle = $('.postingtitle').text();
            const locMatch = fullTitle.match(/\(([^)]+)\)$/);
            if (locMatch) location = locMatch[1];
        }

        // Final Fallback: Extract location from URL subdomain (e.g. "dallas" from dallas.craigslist.org)
        if (!location) {
            try {
                const urlObj = new URL(url);
                const parts = urlObj.hostname.split('.');
                if (parts.length >= 3) {
                    location = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                }
            } catch (e) {
                // ignore
            }
        }

        // Parse Attribute Groups
        const attributes: Record<string, string> = {};

        // Strategy: Iterate over all .attrgroup spans and extract label/value pairs
        // Expected structure: <span class="labl">odometer:</span> <span class="valu">12345</span>
        // OR <div class="attr"><span class="labl">...</span><span class="valu">...</span></div>
        $('.attrgroup .attr').each((_, el) => {
            const label = $(el).find('.labl').text().replace(':', '').trim().toLowerCase();
            const valueSpan = $(el).find('.valu');
            let value = valueSpan.text().trim();

            // If value is inside an <a> tag, text() still captures it, but let's be safe
            // Sometimes value is just text in the span, sometimes it's an <a> link
            if (!value && valueSpan.find('a').length > 0) {
                value = valueSpan.find('a').text().trim();
            }

            if (label && value) {
                attributes[label] = value;
            }
        });

        // Backup strategy for "clean" attributes without labels (e.g. "odometer: 123456" in a single span)
        $('.attrgroup span').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes(':')) {
                const [k, v] = text.split(':').map(s => s.trim());
                if (k && v && !attributes[k.toLowerCase()]) {
                    attributes[k.toLowerCase()] = v;
                }
            }
        });

        const mileage = attributes['odometer'] ? parseInt(attributes['odometer'].replace(/[^0-9]/g, ''), 10) : null;
        let vin = attributes['vin'];

        // 1. Check for alternative attribute keys
        if (!vin) {
            vin = attributes['vin number'] || attributes['vehicle id'];
        }

        // 2. Search Description for VIN pattern (17 chars, no I, O, Q)
        // Basic VIN regex: [A-HJ-NPR-Z0-9]{17}
        const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/i;

        // Clean Description for searching
        let description = $('#postingbody').clone().children().remove().end().text().trim();
        description = description.replace('QR Code Link to This Post', '').trim();

        if (!vin && description) {
            const match = description.match(vinRegex);
            if (match) {
                vin = match[1].toUpperCase();
            }
        }

        // 3. Search Title for VIN pattern
        if (!vin) {
            const match = title.match(vinRegex);
            if (match) {
                vin = match[1].toUpperCase();
            }
        }

        // Extract Model if possible (often combined in title or 'makemodel' class)
        // In the Volvo example: <span class="valu makemodel"><a ...>volvo s60</a></span>
        let makeModel = '';
        let make: string | undefined = undefined;
        let model: string = '';

        const makeModelSpan = $('.makemodel').text().trim();
        if (makeModelSpan) {
            makeModel = makeModelSpan;
            // Simple heuristic since we don't have a DB: First word is Make, rest is Model
            const parts = makeModel.split(' ');
            if (parts.length > 0) {
                make = parts[0];
                model = parts.slice(1).join(' '); // "s60" or "Camry XLE"
            }
        } else {
            // Fallback: try to parse from title if attribute is missing
            // Title: "2015 Toyota Camry XLE" -> "Toyota" "Camry XLE"
            // This is risky without knowing valid makes, so we'll leave it undefined if not explicit
        }

        // title often contains year/make/model: "2013 Ford F-150"
        let year: number | undefined;
        // Try to find year in title first
        const yearMatch = title.match(/^(19|20)\d{2}/);
        if (yearMatch) {
            year = parseInt(yearMatch[0], 10);
        } else if ($('.attrgroup .year').length) {
            // Fallback to .year span if present
            const yearText = $('.attrgroup .year').text().trim();
            year = parseInt(yearText, 10);
        }

        // Description is already cleaned above for VIN search

        const images: string[] = [];
        $('#thumbs a').each((_, el) => {
            const href = $(el).attr('href');
            if (href) images.push(href);
        });

        if (images.length === 0) {
            // Try to find the main swipe image if no thumbs
            const src = $('.swipe .slide').first().find('img').attr('src');
            if (src) images.push(src);
        }

        return {
            title,
            price,
            mileage,
            vin,
            year,
            make: make,
            model: model || makeModel, // Use split model or full string if split failed
            description,
            images,
            sourceUrl: url,
            location: location || undefined,
            conditionExterior: attributes['condition'] || undefined,
            conditionInterior: undefined,
            conditionMechanical: undefined,
            // Capture specific attributes for potential mapping
            transmission: attributes['transmission'],
            fuelType: attributes['fuel'],
            titleStatus: attributes['title status'],
            exteriorColor: attributes['paint color'],
        };
    }
}
