import { scrapeVehicle } from '../src/lib/scrapers';

async function test() {
    const url = 'https://www.autotempest.com/details/abt-522639248';
    console.log(`Testing AutoTempest Scraper on: ${url}`);

    try {
        const result = await scrapeVehicle(url);
        console.log("Success! Extracted Data:");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Scraping failed:", e);
    }
}

test();
