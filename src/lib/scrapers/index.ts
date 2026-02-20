import { Scraper, ScrapedVehicle } from './types';
import { CraigslistScraper } from './craigslist';
import { AutoTempestScraper } from './autotempest';

// Registry of available scrapers
const scrapers: Scraper[] = [
    new CraigslistScraper(),
    new AutoTempestScraper(),
    // CarsAndBidsScraper will go here
];

export async function scrapeVehicle(url: string): Promise<ScrapedVehicle> {
    const scraper = scrapers.find(s => s.canHandle(url));

    if (!scraper) {
        throw new Error(`No scraper found for URL: ${url}`);
    }

    try {
        return await scraper.scrape(url);
    } catch (error: any) {
        throw new Error(`Scraping failed for ${url}: ${error.message}`);
    }
}
