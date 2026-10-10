/**
 * VERA context builder — assembles EVERYTHING known about the current vehicle
 * and app state for the chat brain: saved analysis, form state, CARFAX payload,
 * NHTSA decode, fleet history, and the page the user is on.
 *
 * Server-side so VERA is omniscient on ANY page, not just the evaluation form.
 */
import { kv } from './kv';

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

function money(v: any): string {
    const n = Number(v);
    return isFinite(n) && n !== 0 ? `$${n.toLocaleString()}` : 'unknown';
}

export interface VeraContextResult {
    text: string;
    has: Record<string, boolean>;
}

export async function buildVeraContext(userId: string, page?: string): Promise<VeraContextResult> {
    const has: Record<string, boolean> = { form: false, analysis: false, carfax: false, nhtsa: false, fleet: false };
    const L: string[] = [];

    let form: any = null;
    let analysis: any = null;
    let fleet: any[] = [];

    try {
        form = await kv.get(`${userId}:last_form`);
        has.form = !!form;
    } catch { /* ignore */ }

    try {
        const saved: any = await kv.get(`${userId}:analysis`);
        if (saved?.result) {
            analysis = saved.result;
            has.analysis = true;
            if (saved.vehicle) form = { ...(form || {}), ...saved.vehicle };
        }
    } catch { /* ignore */ }

    try {
        const f = await kv.get(`${userId}:fleet`);
        if (Array.isArray(f)) { fleet = f; has.fleet = f.length > 0; }
    } catch { /* ignore */ }

    const vin = String(form?.vin || '').trim().toUpperCase();
    let carfax: any = null;
    let nhtsa: any = null;
    if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        try { carfax = await kv.get(`carfax:${vin}`); has.carfax = !!carfax; } catch { /* ignore */ }
        try { nhtsa = await kv.get(vin); has.nhtsa = !!nhtsa; } catch { /* ignore */ }
    }

    L.push(`## LIVE APP CONTEXT (authoritative — never contradict it)`);
    L.push(`Current page: ${page || 'unknown'}`);
    L.push(`Today: ${new Date().toISOString().slice(0, 10)}`);

    if (form) {
        const f = form;
        L.push(`\n### Vehicle on screen`);
        L.push([
            f.year && `Year: ${f.year}`, f.make && `Make: ${f.make}`, f.model && `Model: ${f.model}`,
            f.trim && `Trim: ${f.trim}`, f.vin && `VIN: ${f.vin}`, f.price && `Asking price: ${money(f.price)}`,
            f.mileage && `Mileage: ${Number(f.mileage).toLocaleString()} mi`,
            f.titleStatus && `Title: ${f.titleStatus}`, f.transmission && `Transmission: ${f.transmission}`,
            f.fuelType && `Fuel: ${f.fuelType}`, f.drivetrain && `Drivetrain: ${f.drivetrain}`,
            f.engine && `Engine: ${f.engine}`, f.bodyStyle && `Body: ${f.bodyStyle}`,
            f.seats && `Seats: ${f.seats}`, f.exteriorColor && `Exterior: ${f.exteriorColor}`,
            f.interiorColor && `Interior: ${f.interiorColor}`, f.location && `Location: ${f.location}`,
            f.listingUrl && `Listing: ${f.listingUrl}`,
            f.sellerDescription && `Seller description: ${clip(String(f.sellerDescription), 600)}`,
        ].filter(Boolean).join(' | '));
    } else {
        L.push(`\n### Vehicle on screen\nNo vehicle loaded yet — if the user asks about "this car", ask them to paste a listing URL or fill the form.`);
    }

    if (analysis) {
        const a = analysis;
        L.push(`\n### VERA analysis on file (computed deterministically)`);
        L.push(`Verdict: ${a.verdict || 'n/a'} | Score: ${a.verdictScore ?? 'n/a'}/100 | Instant equity: ${money(a.instantEquity)}`);
        if (a.marketValues) {
            const m = a.marketValues;
            L.push(`Market: trade-in ${money(m.tradeIn)}, private party ${money(m.privatePartyAvg)}, retail ${money(m.retail)}`);
        }
        if (a.criticalIssues?.length) {
            L.push(`Issues: ${a.criticalIssues.map((i: any) => `[${i.severity}] ${i.title}`).slice(0, 12).join('; ')}`);
        }
        if (a.maintenanceForecast) {
            const f = a.maintenanceForecast;
            L.push(`Maintenance forecast (${f.dataQuality}, near-term ${money(f.nearTermCost?.low)}–${money(f.nearTermCost?.high)}): ` +
                f.items.slice(0, 10).map((i: any) => `${i.urgency.toUpperCase()}: ${i.item} ($${i.estCost[0]}–$${i.estCost[1]}; ${i.why})`).join(' | '));
        }
        if (a.negotiation) {
            const n = a.negotiation;
            L.push(`Negotiation: open ${money(n.openingOffer)}, target ${money(n.targetPrice)}, walk away above ${money(n.walkAwayPrice)}, potential saving ${money(n.savingsIfSuccessful)}`);
            if (n.leveragePoints?.length) L.push(`Leverage: ${n.leveragePoints.slice(0, 8).join('; ')}`);
            if (n.doNotList?.length) L.push(`Do not mention: ${n.doNotList.slice(0, 6).join('; ')}`);
        }
        if (a.actionPlan) L.push(`Action plan: ${clip(JSON.stringify(a.actionPlan), 900)}`);
        if (a.structuredVerdict) {
            const v = a.structuredVerdict;
            if (v.buyIf?.length) L.push(`Buy if: ${v.buyIf.slice(0, 6).join('; ')}`);
            if (v.walkAwayIf?.length) L.push(`Walk away if: ${v.walkAwayIf.slice(0, 6).join('; ')}`);
            if (v.redFlags?.length) L.push(`Red flags: ${v.redFlags.slice(0, 8).join('; ')}`);
        }
        if (a.operationalCosts) L.push(`Operating costs: ${clip(JSON.stringify(a.operationalCosts), 500)}`);
        if (a.breakEven) L.push(`Break-even: ${clip(JSON.stringify(a.breakEven), 400)}`);
        if (a.rideshare?.eligibility) L.push(`Rideshare: ${clip(JSON.stringify({ eligibility: a.rideshare.eligibility, earnings: a.rideshare.earnings }), 500)}`);
        if (a.insurance) L.push(`Insurance: ${clip(JSON.stringify(a.insurance), 400)}`);
    }

    if (carfax) {
        const c = carfax;
        L.push(`\n### CARFAX report on file`);
        L.push(`Verdict ${c.verdict || 'n/a'} (score ${c.overallScore ?? 'n/a'}): ${clip(String(c.verdictReason || ''), 300)}`);
        L.push(`Title: ${c.titleStatus || 'n/a'} | Owners: ${c.owners ?? 'n/a'} | Incidents: ${Array.isArray(c.incidents) ? c.incidents.length : 'n/a'} | Service records: ${c.serviceRecordCount ?? 'n/a'} (quality ${c.serviceQuality || 'n/a'})`);
        if (c.serviceGaps?.length) L.push(`Service gaps: ${c.serviceGaps.join('; ')}`);
        if (c.openRecalls != null) L.push(`Open recalls: ${c.openRecalls}`);
        if (c.redFlags?.length) L.push(`CARFAX red flags: ${c.redFlags.slice(0, 8).join('; ')}`);
        if (c.greenFlags?.length) L.push(`CARFAX green flags: ${c.greenFlags.slice(0, 8).join('; ')}`);
        if (c.negotiationPoints?.length) L.push(`CARFAX negotiation points: ${c.negotiationPoints.slice(0, 8).join('; ')}`);
        if (c.recommendedInspections?.length) L.push(`Recommended inspections: ${c.recommendedInspections.slice(0, 6).join('; ')}`);
        if (c.summary) L.push(`Summary: ${clip(String(c.summary), 1200)}`);
    }

    if (nhtsa) {
        const n = nhtsa;
        const s = n.specs || {};
        L.push(`\n### NHTSA VIN decode on file`);
        L.push(`Spec: ${[s.year, s.make, s.model, s.trim, s.bodyStyle, s.engine, s.drivetrain, s.transmission, s.fuelType, s.seats && s.seats + ' seats', s.plantCity && 'built ' + s.plantCity].filter(Boolean).join(' | ')}`);
        if (n.safety?.recalls?.length) L.push(`Recall campaigns (${n.safety.recalls.length}): ${n.safety.recalls.map((r: any) => `${r.recall_id} ${r.affected_component}`).slice(0, 6).join('; ')} — remedy status must be verified, not assumed.`);
        if (n.safety?.complaints?.count) L.push(`Owner complaints: ${n.safety.complaints.count} (top: ${(n.safety.complaints.components || []).slice(0, 5).join(', ')})`);
        if (n.safety?.ratings) L.push(`NCAP: ${JSON.stringify(n.safety.ratings)}`);
        if (n.verdict) L.push(`NHTSA baseline score: ${n.verdict.score} (${n.verdict.recommendation}) — ${clip(String(n.verdict.basis || ''), 200)}`);
    }

    if (fleet.length) {
        const rows = fleet.slice(0, 8).map((v: any) =>
            `${v.year || '?'} ${v.make || '?'} ${v.model || ''} · ${money(v.price)} · ${v.mileage ? Number(v.mileage).toLocaleString() + ' mi' : 'mil unknown'} · ${v.verdict || v.analysis?.verdict || 'analyzed'}`);
        L.push(`\n### Fleet (recent vehicles the user is tracking)\n${rows.join('\n')}`);
    }

    L.push(`\n## HOW TO BEHAVE`);
    L.push(`- You are VERA: blunt, specific, commercially sharp. Use the data above; cite concrete numbers.`);
    L.push(`- If a datum above is missing, say what's missing and how to get it (paste a listing URL, drop a CARFAX, decode the VIN) — never invent values.`);
    L.push(`- You can strategize on ANY subject the user raises about this vehicle, its purchase, ownership, financing, repairs, or the app itself.`);
    L.push(`- Infer freely (e.g. which components need attention first from age/mileage/model patterns) but label inference as inference.`);
    L.push(`- Keep answers tight; use the numbers.`);

    return { text: clip(L.join('\n'), 22000), has };
}
