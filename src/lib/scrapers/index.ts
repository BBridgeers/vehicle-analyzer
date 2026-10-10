import { Scraper, ScrapedVehicle } from './types';
import { CraigslistScraper } from './craigslist';
import { AutoTempestScraper } from './autotempest';
import { FacebookMarketplaceScraper } from './facebook';
import { GenericScraper } from './generic';
import { looksLikeSearchPage } from './utils';

// Registry of available scrapers
const scrapers: Scraper[] = [
    new CraigslistScraper(),
    new AutoTempestScraper(),
    new FacebookMarketplaceScraper(),
    new GenericScraper(), // last resort: handles ANY http(s) URL
];

export async function scrapeVehicle(url: string): Promise<ScrapedVehicle> {
    if (looksLikeSearchPage(url)) {
        throw new Error('That URL is a search/results page. Paste the URL of ONE vehicle listing (open the vehicle, then copy that page\'s URL).');
    }
    const scraper = scrapers.find(s => s.canHandle(url));

    if (!scraper) {
        throw new Error(`No scraper found for URL: ${url}`);
    }

    try {
        return await scraper.scrape(url);
    } catch (error: any) {
        const msg = String(error?.message || error);
        if (scraper instanceof FacebookMarketplaceScraper && /fetch failed|ECONNREFUSED|ENOTFOUND|timed out/i.test(msg)) {
            throw new Error(
                'Facebook Marketplace needs the local FB scraper service (127.0.0.1:8765) or an Apify token — neither is configured. ' +
                'Workarounds: paste the listing screenshot (VEHICLE PHOTOS / LISTING SCREENSHOT), or paste a listing from another source.'
            );
        }
        throw new Error(`Scraping failed for ${url}: ${msg}`);
    }
}
