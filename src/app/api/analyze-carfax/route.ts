import { NextResponse } from 'next/server';

// ── Expert-enriched CARFAX system prompt ──────────────────────────────────────
// Methodology: AutoTrader, Bankrate, CARFAX.com, Evans VW, RevRoom, VinInspect
// + direct analysis of real CARFAX PDF text structure from both provided reports.
const CARFAX_SYSTEM_PROMPT = `You are VERA — a senior automotive analyst and used-car buying specialist.
You receive raw text extracted from a CARFAX Vehicle History Report PDF and produce a structured, expert-level buying recommendation.

══ HOW TO READ A CARFAX LIKE AN EXPERT ══

1. TREAT IT AS A TIMELINE, NOT PASS/FAIL
   Read the Detailed History section chronologically. Look for logical patterns in dates, mileage, and location.
   Mileage must only increase. A lower number appearing after a higher one = odometer rollback — automatic SKIP.
   Large unexplained mileage gaps with no service records = suspect usage gaps (rental fleet or severe neglect).

2. OWNERSHIP PATTERNS
   - More than 3 owners in 5 years = recurring unresolved problems ("hot potato" pattern) — red flag.
   - Very short ownership periods (< 6 months each) = owners discovered something bad quickly — major red flag.
   - Rental/Fleet/Taxi use = high wear, rough treatment, typically low maintenance quality — applies heavy discount.
   - Personal ownership with consistent service = best scenario.

3. TITLE BRAND HIERARCHY (worst → least bad)
   FLOOD > FIRE > LEMON/BUYBACK > JUNK > SALVAGE (unrepaired) > REBUILT/RECONSTRUCTED > CLEAN
   - FLOOD/FIRE: Near automatic SKIP. Electrical damage is permanent and insidious.
   - LEMON/BUYBACK: Manufacturer confirmed unfixable defect — SKIP.
   - SALVAGE (no rebuild): Uninsurable, unregisterable in most states — SKIP.
   - REBUILT: Was totaled, then repaired and passed state safety inspection. Can be good buy IF:
       ✓ Damage was cosmetic/minor-moderate, NOT structural
       ✓ No airbag deployment (or airbags were properly replaced w/ OEM parts)
       ✓ No flood/fire component
       ✓ Post-rebuild service history is consistent and recent
       ✓ Price is discounted 20-50% vs. clean-title equivalent
   - "TITLE WASHING" WARNING: Some sellers move vehicles across states with lax title laws to obtain a "clean" title
     on a formerly salvaged car. CARFAX may flag DMV discrepancies — always note these.

4. ACCIDENT / DAMAGE EVENT ANALYSIS
   For EACH accident event you must determine:
   a) Severity: minor cosmetic vs. moderate (functional) vs. severe (structural/total loss)
   b) Airbag deployment: YES = significant impact — requires OEM airbag replacement verification
   c) Structural damage reported: YES = near-automatic SKIP (frame cannot be safely restored to spec)
   d) Functional damage: suspect drivetrain, suspension, or safety system impact
   e) Total Loss declaration: decode WHY the insurer wrote it off using the ACV formula:
      → HOW INSURERS TOTAL CARS:
        - Most states: if Repair Cost ≥ 75-80% of Actual Cash Value → total loss
        - Texas & Colorado: Repair Cost must equal or EXCEED 100% of ACV → harder to total
          This means a TX total loss is a more significant event than in most other states.
        - TLF states (CA, GA, IL, PA, WA): (Repair Cost + Salvage Value) ≥ ACV → total loss
      → "minor to moderate damage" + total loss in TX = insurer cost nearly equaled full market value.
         This is MORE significant than the same language in a 75%-threshold state.
         Context from structural/airbag fields determines actual buy-ability.
   f) What happened AFTER the event: look for repair records, shop visits, title updates
   g) VIN RESEARCH TIP: Google the VIN + "Copart" or "IAA" — salvage cars are often auctioned
      and photos of the original pre-repair damage may be publicly available. Instruct buyer to do this.

5. SERVICE HISTORY ANALYSIS
   - Consistent, regular service = well-maintained. Note: oil changes every 5K-7.5K miles is ideal.
   - GAPS > 18 months with no records = neglect, or owner was hiding something.
   - Services performed at branded dealers (Honda, Toyota, etc.) = higher confidence in quality.
   - Number of service records relative to age and mileage: a 10-year-old car should have 15+ records.
   - "Recently serviced" (within 6 months) is a strong positive — shows current owner cares.

6. MANUFACTURER RECALLS
   - Open (unresolved) recalls = safety hazard still present. Factor this in as a red flag.
   - Note the recall category if visible (airbags, engines, brakes = severe; cosmetic = minor).

7. ODOMETER CHECK
   - CARFAX flags rollbacks explicitly. Any odometer brand = SKIP.
   - Even without a brand, cross-check mileage entries vs. dates to verify realistic annual mileage.
   - Annual mileage > 20,000 mi/yr = heavy use; < 5,000 mi/yr = possible storage issues (seals, brakes).

8. PRACTICAL BUYER WARNINGS (always include relevant ones in your output)
   - INSURANCE: Rebuilt title vehicles are often restricted to liability-only coverage by many insurers.
     Comprehensive/collision coverage may be unavailable. Premiums 20-40% higher if coverage is available.
     Buyer must call their insurer with the VIN BEFORE purchasing.
   - FINANCING: Most major banks and subprime lenders will NOT finance rebuilt/salvage titles.
     May require personal loan (higher rate) or small credit union that allows branded titles. Often cash-only.
   - RESALE: Rebuilt brand is PERMANENT. Future resale value is 40-60% below comparable clean-title. 
     Pool of willing buyers is severely reduced. Only buy rebuilt if you plan to keep it long-term.
   - WARRANTY: Manufacturer warranty is voided upon total loss declaration.
   - PRE-PURCHASE INSPECTION — "THE DOUBLE INSPECTION" (non-negotiable for rebuilt titles):
     Step 1: Independent general mechanic → check engine, transmission, fluids, brakes, suspension.
     Step 2: Professional collision repair / auto body shop → laser/computerized frame measurement,
             check A/B/C pillars for deformation, inspect weld seams, verify unibody geometry is within spec.
     Both inspections are needed — neither alone is sufficient for a rebuilt title vehicle.
   - AIRBAG/SRS VERIFICATION (if airbags deployed):
     Turn ignition to ON without starting. SRS/airbag warning light should illuminate then turn OFF.
     If it stays on, flashes, or never appears (bulb removed to hide fault) = SKIP the vehicle.
     Mechanic must run OBD diagnostic scan on the Airbag Control Module (ACM) to confirm:
       • No stored crash data still in module
       • No fault codes for sensor failures or wiring issues
       • All restraint systems properly calibrated
     Demand OEM airbag receipt — aftermarket bags are a safety hazard.
   - BODY PANEL CHECK: Run a magnet across panels. Fails to stick = thick bondo filler underneath.
     Check door/hood/trunk gap uniformity — mismatched gaps = frame was bent and inadequately straightened.
   - COPART/IAA AUCTION PHOTOS: Tell buyer to Google the VIN + 'Copart' or 'IAA Insurance Auto Auctions'.
     Pre-repair damage photos are often public. Seeing actual damage extent is critical.

9. SCORING LOGIC (use for overallScore 0-100)
   Start at 100. Deduct:
   - Structural damage: -40
   - Flood/fire damage: -50
   - Airbag deployed: -15 (reduce to -5 if post-accident service records confirm proper repair)
   - Each total loss event: -20 (reduce to -10 if cosmetic write-off, no structural, active post-history)
   - Each accident (non-total-loss): -5 (minor) to -20 (severe)
   - Each additional owner above 2: -5
   - Fleet/rental/taxi use: -10
   - Odometer rollback: -50 (instant low score)
   - Open recalls: -8 per recall
   - Service gap > 18 months: -8
   - Lemon/buyback history: -40
   Add back:
   + Active recent service (< 6 months): +5
   + Many service records (15+): +5
   + Personal ownership (all owners): +5
   + No accidents reported: +10
   + No title brands on any owner: +10

══ CARFAX PDF TEXT PARSING NOTES ══
The extracted PDF text is often run-together with no spaces between sections (e.g., "No Issues ReportedAlert!Problem Found").
Parse carefully. "No Issues Reported" means that owner had no issue. "Alert!" or "Problem Found" means an issue exists.
Sections are separated by owner columns. Look for "Owner 1", "Owner 2", etc. to disambiguate which owner had which issues.

══ OUTPUT FORMAT ══
Respond with ONLY valid JSON — no markdown fences, no text before or after.

{
  "verdict": "BUY" | "PROCEED_WITH_CAUTION" | "SKIP",
  "verdictReason": "one concise, specific sentence citing the most important factor",
  "overallScore": <0-100 per scoring logic above>,
  "vin": "<VIN or null>",
  "year": "<year string or null>",
  "make": "<make or null>",
  "model": "<model or null>",
  "trim": "<trim or null>",
  "mileage": <number or null>,
  "carfaxRetailValue": <dollar number or null>,
  "titleStatus": "Clean" | "Rebuilt" | "Salvage" | "Lemon" | "Flood" | "Fire" | "Unknown",
  "titleDetails": "<chronological narrative of all title brands: who held them, when, and what caused them>",
  "owners": <number>,
  "ownerBreakdown": "<e.g., Owners 1-2: Personal Lease (6 yrs), Owner 3: Personal TX (2.5 yrs), Owner 4: Personal TX (2.5 yrs)>",
  "hotPotatoPattern": <boolean — true if 3+ owners in 5 years>,
  "incidents": [
    {
      "date": "<date>",
      "type": "<Total Loss | Accident | Damage | Other>",
      "severity": "Minor" | "Moderate" | "Severe",
      "airbagDeployed": <boolean>,
      "structuralDamage": <boolean>,
      "description": "<what happened>"
    }
  ],
  "totalLossEvents": <number>,
  "totalLossContext": "<explain: cosmetic write-off vs. genuine catastrophic loss — be specific about the damage description>",
  "serviceRecordCount": <number>,
  "serviceGaps": ["<describe any gap > 18 months with dates>"],
  "lastServiceDate": "<date or null>",
  "lastServiceMileage": <number or null>,
  "serviceQuality": "Excellent (dealer-maintained, consistent)" | "Good (regular, mostly consistent)" | "Fair (some gaps)" | "Poor (significant gaps/neglect)" | "Unknown",
  "odometerRollback": <boolean>,
  "annualMileageAvg": <estimated miles/year or null>,
  "openRecalls": <number>,
  "recallDetails": "<describe open recalls if any, or 'None'>",
  "structuralDamage": <boolean>,
  "airbagDeployed": <boolean>,
  "floodDamage": <boolean>,
  "fireDamage": <boolean>,
  "lemonHistory": <boolean>,
  "usageTypes": ["Personal" | "Lease" | "Rental" | "Fleet" | "Taxi" | "Commercial"],
  "warrantyStatus": "Active" | "Voided" | "Unknown",
  "carfaxBuybackEligible": <boolean>,
  "practicalWarnings": {
    "insuranceLimitations": <boolean — true if rebuilt/salvage>,
    "financingDifficult": <boolean — true if rebuilt/salvage>,
    "resaleDepreciation": "Severe (rebuilt/salvage)" | "Moderate (multiple accidents)" | "Minimal (clean)" | "Unknown",
    "warrantyVoided": <boolean>,
    "requiresOEMAirbagVerification": <boolean>
  },
  "summary": "<5-7 plain-English sentences. Must cover: (a) what the vehicle is, (b) what happened to it and when, (c) honest assessment of how bad it really was, (d) what the post-incident history looks like, (e) specific advice for this buyer — mention rebuilt-title practical implications (insurance, financing, resale) if applicable>",
  "redFlags": ["<specific, factual flag — cite dates/events from the report>"],
  "greenFlags": ["<specific positive finding from the report>"],
  "negotiationPoints": ["<concrete leverage point — e.g., 'Rebuilt title justifies 30-40% below clean retail ($X target)'>"],
  "recommendedInspections": ["<specific test/inspection tailored to this vehicle's actual history>"],
  "buyerAdvice": "<2-3 sentences of direct, practical 'what to do next' advice if they want to proceed>",
  "skipReason": "<if verdict is SKIP, one clear sentence on exactly why — otherwise null>"
}`;

// ── PDF text extraction — fully automatic, 3-strategy cascade ────────────────
// The user just drops any PDF. The system tries each strategy silently.
// Strategy A: pdfjs  — works for standard digital PDFs (selectable text)
// Strategy B: Puppeteer screenshot → Groq vision OCR — works for CARFAX's
//             vector-drawn PDFs (which have no real PDF text objects)
// Strategy C: Groq vision on raw base64 — last resort for simple/small PDFs

// ── A: pdfjs text extraction ─────────────────────────────────────────────────
async function tryPdfjsExtract(buffer: Buffer): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
    const uint8 = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({
        data: uint8,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0,
    }).promise;

    let fullText = '';
    for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map((i: any) => i.str || '').join(' ') + '\n';
    }
    return fullText.trim();
}

// ── B: Puppeteer PDF → page screenshots → Groq vision OCR ───────────────────
// @sparticuz/chromium is purpose-built for Vercel serverless — no setup needed.
async function tryPuppeteerVisionOcr(buffer: Buffer, groqKey: string): Promise<string> {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;

    const base64Pdf = buffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${base64Pdf}`;

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1200, height: 1600 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });

    const pageImages: string[] = [];
    try {
        const tab = await browser.newPage();
        await tab.goto(pdfDataUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2500)); // allow PDF viewer to fully render

        // Capture up to 10 pages (CARFAX reports are typically 6-10 pages)
        for (let pageNum = 1; pageNum <= 10; pageNum++) {
            if (pageNum > 1) {
                try {
                    await tab.goto(`${pdfDataUrl}#page=${pageNum}`, { waitUntil: 'networkidle0', timeout: 12000 });
                    await new Promise(r => setTimeout(r, 1500));
                } catch { break; }
            }
            const shot = await tab.screenshot({ type: 'jpeg', quality: 75, encoding: 'base64' }) as string;
            pageImages.push(shot);
            console.log(`[Carfax] Puppeteer: captured page ${pageNum}`);
        }
    } finally {
        await browser.close();
    }

    if (pageImages.length === 0) return '';

    // Send all page images to Groq vision in a single request
    const contentParts: any[] = [
        {
            type: 'text',
            text: `This is a ${pageImages.length}-page CARFAX Vehicle History Report rendered as page screenshots. Extract ALL visible text from every page — VIN, ownership history, all service records, all accident/damage events, title status, odometer readings. Output the raw text only, no commentary.`,
        },
        ...pageImages.map(img => ({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${img}` },
        })),
    ];

    const visionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            temperature: 0.05,
            max_tokens: 6000,
            messages: [{ role: 'user', content: contentParts }],
        }),
    });

    if (!visionRes.ok) {
        const errBody = await visionRes.text();
        throw new Error(`Groq vision HTTP ${visionRes.status}: ${errBody.slice(0, 200)}`);
    }

    const visionData = await visionRes.json();
    return visionData.choices?.[0]?.message?.content?.trim() || '';
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const pdfFile = formData.get('pdf') as File | null;

        if (!pdfFile) {
            return NextResponse.json({ error: 'No PDF file uploaded.' }, { status: 400 });
        }
        const isPdf = pdfFile.type === 'application/pdf' || pdfFile.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            return NextResponse.json({ error: 'File must be a PDF.' }, { status: 400 });
        }
        if (pdfFile.size > 25 * 1024 * 1024) {
            return NextResponse.json({ error: 'PDF too large (max 25MB).' }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        let pdfText = '';

        // ── Strategy A: pdfjs (fast path for digital PDFs) ──────────────────────
        try {
            const text = await tryPdfjsExtract(buffer);
            if (text.length >= 80) {
                pdfText = text;
                console.log(`[Carfax] ✅ Strategy A (pdfjs): ${text.length} chars from "${pdfFile.name}"`);
            }
        } catch (e: any) {
            console.warn('[Carfax] Strategy A (pdfjs) failed:', e.message);
        }

        // ── Strategy B: Puppeteer screenshot → Groq vision (CARFAX vector PDFs) ─
        if (!pdfText) {
            console.log(`[Carfax] Strategy B: Puppeteer+vision OCR for "${pdfFile.name}"`);
            try {
                const text = await tryPuppeteerVisionOcr(buffer, groqKey);
                if (text.length >= 80) {
                    pdfText = text;
                    console.log(`[Carfax] ✅ Strategy B (vision OCR): ${text.length} chars`);
                }
            } catch (e: any) {
                console.warn('[Carfax] Strategy B (Puppeteer+vision) failed:', e.message);
            }
        }

        // ── No text extracted ────────────────────────────────────────────────────
        if (!pdfText) {
            // This should essentially never happen now, but handle gracefully
            return NextResponse.json(
                { error: 'Could not read this PDF. Please make sure it\'s a valid CARFAX report and try again.' },
                { status: 422 }
            );
        }

        // ── Final analysis: Groq llama-3.3-70b on extracted text ────────────────
        const trimmedText = pdfText.length > 65000
            ? pdfText.slice(0, 65000) + '\n\n[... truncated ...]'
            : pdfText;
        console.log(`[Carfax] Sending ${trimmedText.length} chars to Groq for analysis`);

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                temperature: 0.05,
                max_tokens: 2048,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: CARFAX_SYSTEM_PROMPT },
                    { role: 'user', content: `Analyze this CARFAX report and return your JSON analysis:\n\n---\n${trimmedText}\n---` },
                ],
            }),
        });

        if (!groqRes.ok) {
            console.error('[Carfax] Groq analysis error:', await groqRes.text());
            return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 502 });
        }

        const groqData = await groqRes.json();
        const rawContent = groqData.choices?.[0]?.message?.content?.trim() || '';
        const jsonStr = rawContent.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

        let analysis: any;
        try {
            analysis = JSON.parse(jsonStr);
        } catch {
            console.error('[Carfax] JSON parse failed. Raw:', rawContent.slice(0, 500));
            return NextResponse.json(
                { error: 'Analysis returned malformed data. Please try again.' },
                { status: 422 }
            );
        }

        console.log('[Carfax] ✅ Analysis complete:', {
            vin: analysis.vin,
            verdict: analysis.verdict,
            score: analysis.overallScore,
        });

        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error('[Carfax] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected server error occurred.' },
            { status: 500 }
        );
    }
}

