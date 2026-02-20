const https = require('https');

const url = 'https://carsandbids.com/auctions/KVDM0v0O/2006-porsche-cayman-s';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1'
};

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: headers
        };
        https.get(url, options, (res) => {
            console.log('Status Code:', res.statusCode);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

fetchUrl(url).then(html => {
    if (html.includes('Just a moment') || html.includes('_cf_chl_opt')) {
        console.log('STILL BLOCKED by Cloudflare');
    } else {
        console.log('SUCCESS! Content length:', html.length);
        console.log('Title:', html.match(/<title>(.*?)<\/title>/)?.[1]);
    }
});
