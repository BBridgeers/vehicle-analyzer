/**
 * VERA's live internet access — keyless web research (DuckDuckGo HTML + bounded page fetch).
 * Server-side only, hard timeouts, no key required.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

export interface WebHit { title: string; snippet: string; url: string }

export async function webSearch(query: string, max = 4): Promise<WebHit[]> {
    const hits: WebHit[] = [];
    try {
        const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
            signal: AbortSignal.timeout(12000),
        });
        const html = await res.text();
        const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]+class="result__a"|$)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(html)) && hits.length < max) {
            let url = m[1];
            const uddg = url.match(/uddg=([^&]+)/);
            if (uddg) url = decodeURIComponent(uddg[1]);
            if (!/^https?:/.test(url)) continue;
            const snip = (m[3].match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || '';
            hits.push({ title: strip(m[2]), snippet: strip(snip).slice(0, 300), url: url.slice(0, 160) });
        }
    } catch { /* offline or blocked — return what we have */ }
    return hits;
}

/** Best-effort text of a page (bounded) for citation. */
export async function fetchPageText(url: string, maxChars = 2500): Promise<string> {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) return '';
        const html = await res.text();
        const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
        return strip(body).slice(0, maxChars);
    } catch { return ''; }
}

/** Research intent detection — decides whether a turn deserves a live lookup. */
export function needsResearch(text: string): boolean {
    const t = String(text || '').toLowerCase();
    if (t.length < 12) return false;
    return /\b(current|today|right now|latest|live|news|price|prices|worth|market|value|going rate|kbb|edmunds|recall|recalls|reliability|common problems|known issues|complaints|tsb|service bulletin|cost to (fix|replace|repair)|how much (does|do|is|are)|review|reviews|problems with)\b/.test(t);
}

/** Compose a compact research block for the model. */
export async function researchBlock(query: string): Promise<string> {
    const hits = await webSearch(query, 4);
    if (!hits.length) return '';
    const lines = [`## LIVE WEB RESEARCH (fetched ${new Date().toISOString().slice(0, 16)}Z for: "${query.slice(0, 120)}")`];
    for (const h of hits) lines.push(`- ${h.title}: ${h.snippet} [${h.url}]`);
    const detail = await fetchPageText(hits[0].url, 1800);
    if (detail) lines.push(`\nTop source excerpt (${hits[0].url.slice(0, 90)}): ${detail}`);
    lines.push(`Cite these sources and their dates when you use them; say so plainly if they don't answer the question.`);
    return lines.join('\n');
}
