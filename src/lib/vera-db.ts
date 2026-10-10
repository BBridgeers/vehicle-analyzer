/**
 * VERA's database access — local market comps + SQLite record stats.
 * Server-side only.
 */
import * as fs from 'fs';
import * as path from 'path';

const COMP_FILES = ['golden_vehicles.json', 'at_golden_vehicles.json', 'cl_golden_vehicles.json'];

export interface CompResult {
    datasetSize: number;
    matched: number;
    priceRange: { low: number; high: number; avg: number } | null;
    samples: string[];
}

export function loadAllComps(): any[] {
    const out: any[] = [];
    for (const f of COMP_FILES) {
        try {
            const p = path.join(process.cwd(), f);
            const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
            if (Array.isArray(d)) out.push(...d);
        } catch { /* dataset missing is fine */ }
    }
    return out;
}

export function comparablesFor(make?: string, model?: string, limit = 8): CompResult {
    const all = loadAllComps();
    const m = String(make || '').toLowerCase().trim();
    const mo = String(model || '').toLowerCase().trim();
    const matched = (m && mo)
        ? all.filter(v => {
            const vm = String(v.make || '').toLowerCase();
            const vmo = String(v.model || '').toLowerCase();
            return vm === m && (vmo.includes(mo) || mo.includes(vmo) || vmo.split(' ')[0] === mo.split(' ')[0]);
        })
        : [];
    const prices = matched.map(v => Number(v.price)).filter(n => isFinite(n) && n > 0);
    return {
        datasetSize: all.length,
        matched: matched.length,
        priceRange: prices.length
            ? { low: Math.min(...prices), high: Math.max(...prices), avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) }
            : null,
        samples: matched.slice(0, limit).map(v =>
            `${v.year || '?'} ${v.make || ''} ${v.model || ''}${v.trim ? ' ' + v.trim : ''} · ${v.price ? '$' + Number(v.price).toLocaleString() : 'price ?'} · ${v.mileage ? Number(v.mileage).toLocaleString() + ' mi' : 'mileage ?'}${v.vin ? ' · ' + v.vin : ''}`),
    };
}

/** Free-form LIKE search across the local datasets (any token in make/model/title/description). */
export function searchComps(query: string, limit = 8): string[] {
    const toks = String(query || '').toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (!toks.length) return [];
    const all = loadAllComps();
    const hits = all.filter(v => {
        const hay = `${v.make || ''} ${v.model || ''} ${v.trim || ''} ${v.title || ''} ${v.description || ''} ${v.year || ''}`.toLowerCase();
        return toks.every(t => hay.includes(t));
    });
    return hits.slice(0, limit).map(v =>
        `${v.year || '?'} ${v.make || ''} ${v.model || ''}${v.trim ? ' ' + v.trim : ''} · ${v.price ? '$' + Number(v.price).toLocaleString() : 'price ?'} · ${v.mileage ? Number(v.mileage).toLocaleString() + ' mi' : 'mileage ?'}`);
}
