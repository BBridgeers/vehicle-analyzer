
/** True when a URL points at a search/results/browse page rather than one vehicle. */
export function looksLikeSearchPage(url: string): boolean {
    const u = url.toLowerCase();
    if (/\/(search|results|browse|marketplace\/search)/.test(u)) return true;
    if (/[?&](query|q|keyword|search|k)=/.test(u)) return true;
    if (/autotempest\.com\/results/.test(u)) return true;
    return false;
}

/** First JSON-LD object found in the page that looks vehicle/product shaped. */
export function extractJsonLd(html: string): any | null {
    const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const b of blocks) {
        try {
            const parsed = JSON.parse(b[1].trim());
            const candidates = Array.isArray(parsed) ? parsed : [parsed];
            for (const c of candidates) {
                if (!c) continue;
                if (c['@type'] === 'ItemList' && Array.isArray(c.itemListElement)) {
                    const first = c.itemListElement[0]?.item || c.itemListElement[0];
                    if (first) return first;
                }
                if (c.offers || c.name || c['@type'] === 'Vehicle' || c['@type'] === 'Product' || c['@type'] === 'Car') return c;
            }
        } catch { /* malformed block — skip */ }
    }
    return null;
}

const KNOWN_MAKES = new Set(['toyota','honda','ford','chevrolet','chevy','nissan','bmw','mercedes','mercedes-benz','audi','lexus','acura','subaru','volkswagen','vw','hyundai','kia','mazda','jeep','dodge','ram','gmc','cadillac','buick','chrysler','tesla','volvo','land rover','jaguar','porsche','infiniti','lincoln','mitsubishi','mini','fiat','genesis','scion','saturn','pontiac','oldsmobile','suzuki','isuzu','rivian','lucid','polestar']);
const NON_MODEL = new Set(["it's",'its','runs','running','good','great','drives','clean','nice','sale','for','cash','firm','obo','needs','work','low','miles','mile','mi','new','used','title','salvage','rwd','fwd','awd','4wd','automatic','manual','cvt','gas','diesel','hybrid','electric','only','one','owner','owners','no','accidents']);

/** Parse "2013 Chevrolet Volt Premium" style titles into identity fields. */
export function parseVehicleTitle(title: string): { year?: number; make?: string; model?: string; trim?: string } {
    const parts = String(title || '').replace(/[|•]/g, ' ').trim().split(/\s+/);
    let year: number | undefined;
    const ym = parts[0]?.match(/^(19\d{2}|20[0-2]\d)$/);
    if (ym) { year = Number(ym[1]); parts.shift(); }
    for (let i = 0; i < parts.length; i++) {
        const w = parts[i].toLowerCase().replace(/[,.!\-"]/g, '');
        const two = i + 1 < parts.length ? `${w} ${parts[i + 1].toLowerCase().replace(/[,.!\-"]/g, '')}` : '';
        let make = '';
        let consumed = 1;
        if (KNOWN_MAKES.has(w)) { make = parts[i]; }
        else if (two && KNOWN_MAKES.has(two)) { make = `${parts[i]} ${parts[i + 1]}`; consumed = 2; }
        if (make) {
            const modelParts: string[] = [];
            for (const mp of parts.slice(i + consumed)) {
                if (NON_MODEL.has(mp.toLowerCase().replace(/[,.!\-"]/g, ''))) break;
                modelParts.push(mp);
                if (modelParts.length >= 3) break;
            }
            return { year, make, model: modelParts.join(' ') || undefined, trim: undefined };
        }
    }
    return { year };
}

/** First plausible 17-char VIN in a document. */
export function extractVin(html: string): string | undefined {
    const m = String(html).toUpperCase().match(/\b([A-HJ-NPR-Z0-9]{17})\b/g);
    if (!m) return undefined;
    return m.find(v => /[A-HJ-NPR-Z]/.test(v[0]) && /\d/.test(v)) ;
}

/** Mileage like "130,777 miles" / "61k mi". */
export function extractMileage(text: string): number | null {
    const k = String(text).match(/\b([0-9]{1,3})\s?k\s?(?:mi|miles)\b/i);
    if (k) return Number(k[1]) * 1000;
    const m = String(text).replace(/,/g, '').match(/\b([0-9]{4,7})\s*(?:mi|miles)\b/i);
    return m ? Number(m[1]) : null;
}


export const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
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

export async function fetchWithHeaders(url: string, customHeaders: Record<string, string> = {}) {
    const response = await fetch(url, {
        headers: {
            ...COMMON_HEADERS,
            ...customHeaders
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
}
