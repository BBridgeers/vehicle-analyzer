const https = require('https');
const fs = require('fs');

const url = 'https://carsandbids.com/auctions/KVDM0v0O/2006-porsche-cayman-s';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

fetchUrl(url).then(html => {
    fs.writeFileSync('carsandbids_dump.html', html);
    console.log('Cars & Bids HTML saved to carsandbids_dump.html');
});
