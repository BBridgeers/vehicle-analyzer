const https = require('https');
const fs = require('fs');

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        }, (res) => {
            // Handle redirects if needed
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log(`Redirected to: ${res.headers.location}`);
                resolve(fetchUrl(res.headers.location));
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                headers: res.headers,
                data: data
            }));
        }).on('error', reject);
    });
}

async function run() {
    console.log("Fetching AutoTempest Detail Link...");
    const url = 'https://www.autotempest.com/details/abt-522639248';
    let res = await fetchUrl(url);
    console.log(`Status: ${res.status}`);

    fs.writeFileSync('autotempest_detail_dump.html', res.data);
    console.log("Saved detail HTML to autotempest_detail_dump.html");
}

run().catch(console.error);
