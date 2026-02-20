const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('autotempest_detail_dump.html', 'utf8');
const $ = cheerio.load(html);

console.log("Analyzing detail page...");

const title = $('title').text();
console.log(`Title Tag: ${title}`);

// Let's try to find common data class names that might exist
const h1 = $('h1').text().trim();
console.log(`H1 content: ${h1}`);

const priceText = $('.price').text().trim() || $('.listing-detail-price').text().trim() || $('[itemprop="price"]').text().trim();
console.log(`Price: ${priceText}`);

const mileageText = $('.mileage').text().trim() || $('.listing-detail-mileage').text().trim();
console.log(`Mileage: ${mileageText}`);

// Find all specs (usually in dt/dd pairs or tables or specific divs)
const specs = {};
$('.spec, .detail, [itemprop]').each((i, el) => {
    const prop = $(el).attr('itemprop');
    const text = $(el).text().trim();
    if (prop) {
        specs[prop] = text;
    }
});
console.log("Itemprop specs:", specs);

// See if there's any JSON state
const scriptTags = $('script').map((i, el) => $(el).html()).get();
const nextData = scriptTags.find(s => s && s.includes('__NEXT_DATA__'));
if (nextData) {
    console.log("Found __NEXT_DATA__ block (Next.js app)");
    fs.writeFileSync('autotempest_state_dump.json', nextData);
}

const windowData = scriptTags.find(s => s && s.includes('window.App =') || s.includes('window.__INITIAL_STATE__') || s.includes('window.results') || s.includes('window.__data'));
if (windowData) {
    console.log("Found window state block");
    fs.writeFileSync('autotempest_state_dump.txt', windowData);
}

// Just regex out a VIN if possible
const vinMatch = html.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
if (vinMatch) {
    console.log(`Regex found potential VIN: ${vinMatch[1]}`);
}
