const https = require('https');
const cheerio = require('cheerio');

const url = 'https://dallas.craigslist.org/dal/cto/d/dallas-2016-volvo-s60-clean/7915591126.html';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
    'Cache-Control': 'no-cache'
};

function fetchWithHeaders(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

(async () => {
    try {
        console.log('Fetching:', url);
        const html = await fetchWithHeaders(url);
        console.log('Got HTML, length:', html.length);
        const $ = cheerio.load(html);

        const title = $('#titletextonly').text().trim();
        const priceText = $('.price').first().text().trim();
        const price = priceText ? parseInt(priceText.replace(/[^0-9]/g, ''), 10) : null;

        const attributes = {};

        // REPLICATING NEW LOGIC
        $('.attrgroup .attr').each((_, el) => {
            const label = $(el).find('.labl').text().replace(':', '').trim().toLowerCase();
            const valueSpan = $(el).find('.valu');
            let value = valueSpan.text().trim();
            if (!value && valueSpan.find('a').length > 0) {
                value = valueSpan.find('a').text().trim();
            }
            if (label && value) attributes[label] = value;
        });

        $('.attrgroup span').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes(':')) {
                const [k, v] = text.split(':').map(s => s.trim());
                if (k && v && !attributes[k.toLowerCase()]) attributes[k.toLowerCase()] = v;
            }
        });

        const mileage = attributes['odometer'] ? parseInt(attributes['odometer'].replace(/[^0-9]/g, ''), 10) : null;
        const vin = attributes['vin'] || null;

        const fs = require('fs');

        // NEW LOGIC: Make and Location
        let makeModel = '';
        let make = undefined;
        let model = '';
        const makeModelSpan = $('.makemodel').text().trim();
        if (makeModelSpan) {
            makeModel = makeModelSpan;
            const parts = makeModel.split(' ');
            if (parts.length > 0) {
                make = parts[0];
                model = parts.slice(1).join(' ');
                // Capitalize Make for better display
                make = make.charAt(0).toUpperCase() + make.slice(1);
            }
        }

        let location = $('.postingtitletext small').text().trim().replace(/[()]/g, '');
        if (!location) {
            const fullTitle = $('.postingtitle').text();
            const locMatch = fullTitle.match(/\(([^)]+)\)$/);
            if (locMatch) location = locMatch[1];
        }

        if (!location) {
            try {
                // Manually parse URL string since we don't have URL object available in this older Node context potentially, 
                // but actually verify_volvo.js is running in Node so URL is fine.
                const urlObj = new URL(url);
                const parts = urlObj.hostname.split('.');
                if (parts.length >= 3) {
                    location = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                }
            } catch (e) {
                // ignore
            }
        }

        const output = {
            attributes: attributes,
            final: { title, price, mileage, vin, make, model, location },
            scrapedAt: new Date().toISOString()
        };
        fs.writeFileSync('verification_result.json', JSON.stringify(output, null, 2));
        console.log('Written to verification_result.json');

    } catch (e) {
        const fs = require('fs');
        fs.writeFileSync('verification_error.json', JSON.stringify({ error: e.message, stack: e.stack }));
    }
})();
