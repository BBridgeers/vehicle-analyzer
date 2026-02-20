const https = require('https');
const http = require('http');

// Simple fetch implementation for Node.js
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        try {
            const client = url.startsWith('https') ? https : http;

            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                },
                timeout: 5000 // Set socket timeout
            };

            const req = client.get(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        preview: data.substring(0, 500),
                        length: data.length
                    });
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ status: 408, preview: "TIMEOUT", length: 0 });
            });

            req.on('error', (e) => resolve({ status: 0, preview: "ERROR: " + e.message, length: 0 }));

        } catch (e) {
            resolve({ status: 0, preview: "EXCEPTION: " + e.message, length: 0 });
        }
    });
}

// Cars.com moved to end because it hangs
const targets = [
    { name: 'Craigslist (Dallas)', url: 'https://dallas.craigslist.org/search/cta' },
    { name: 'AutoTrader', url: 'https://www.autotrader.com/cars-for-sale/all-cars' },
    { name: 'AutoTempest', url: 'https://www.autotempest.com/results' },
    { name: 'CarGurus', url: 'https://www.cargurus.com/' },
    { name: 'Edmunds', url: 'https://www.edmunds.com/inventory/srp.html' },
    { name: 'Hemmings', url: 'https://www.hemmings.com/classifieds/cars-for-sale' },
    { name: 'Bring a Trailer', url: 'https://bringatrailer.com/auctions/' },
    { name: 'Cars & Bids', url: 'https://carsandbids.com/' },
    { name: 'Cars.com', url: 'https://www.cars.com/shopping/results/' }
];

async function runTest() {
    console.log("=== URL IMPORT FEASIBILITY TEST (Expanded) ===\n");

    for (const target of targets) {
        process.stdout.write(`Checking: ${target.name}... `);
        try {
            const start = Date.now();
            const result = await fetchUrl(target.url);
            const duration = Date.now() - start;

            console.log(`[${result.status}] (${duration}ms) - ${result.length} bytes`);

            if (result.status === 200 && result.length > 50000) {
                console.log("✅ SUCCESS");
            } else {
                console.log(`❌ BLOCKED/ISSUE (${result.preview.substring(0, 50).replace(/\n/g, '')}...)`);
            }
            console.log("-".repeat(20));

            // Sleep 1s
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.log(`❌ FATAL ERROR: ${error.message}`);
        }
    }
}

runTest();
