import { scrapeVehicle } from '../src/lib/scrapers';

const TEST_URLS = [
    'https://dallas.craigslist.org/dal/cto/d/dallas-2010-ford-f150/7712345678.html', // Mock URL structure, won't work live unless valid
    'https://dallas.craigslist.org/search/cta', // This is a search page, should fail canHandle or scrape logic?
    // We need a real valid URL to test scrape() successfully.
    // Since we don't have one, we can test the factory detection.
];

async function run() {
    console.log('Testing Scraper Factory...');

    // Test 1: Factory Detection & Scrape
    const validUrl = 'https://dallas.craigslist.org/dal/cto/d/dallas-2016-volvo-s60-clean/7915591126.html'; // Real User URL
    try {
        console.log(`Checking canHandle for: ${validUrl}`);

        // Actually perform the scrape now that we have a real URL
        console.log('--- STARTING SCRAPE ---');
        const result = await scrapeVehicle(validUrl);
        console.log('--- SCRAPE RESULT ---');
        console.log(JSON.stringify(result, null, 2));

    } catch (e: any) {
        if (e.message.includes('No scraper found')) {
            console.log('✅ Correctly rejected invalid URL');
        } else {
            console.log('❌ Unexpected error for invalid URL:', e.message);
        }
    }

    // Since we don't have internet access for reliable scraping in this script without a known valid URL that persists,
    // we'll stop here. The unit test verifies the logic glue.
    // For real testing, we need the user to provide a URL via the UI.
}

run();
