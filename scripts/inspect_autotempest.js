const https = require('https');
const fs = require('fs');

const url = 'https://www.autotempest.com/results?make=ford&model=f150&zip=90210';

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
    fs.writeFileSync('autotempest_dump.html', html);
    console.log('AutoTempest HTML saved to autotempest_dump.html');

    // Check for JSON blob
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
    if (jsonMatch) {
        console.log('Found __NEXT_DATA__!');
    } else {
        console.log('No __NEXT_DATA__ found.');
    }
});
