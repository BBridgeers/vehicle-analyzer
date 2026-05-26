import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, EXTRACT_LIMIT } from '@/lib/rate-limit';
import { MASTER_INSPECTOR_KNOWLEDGE } from '@/lib/master-inspector';

const EXTRACTION_PROMPT = `You are a vehicle listing data extraction engine. Analyze this screenshot of a vehicle listing (likely from Facebook Marketplace or similar) and extract ALL visible information into structured JSON.

${MASTER_INSPECTOR_KNOWLEDGE}

═══════════════════════════════════════════
EXTRACTION TASK:
═══════════════════════════════════════════

STEP 1 — READ THE BROWSER ADDRESS BAR FIRST:
Before reading any listing content, look at the very top of the screenshot. There will be a browser address bar (Chrome/Edge/Firefox) showing the full URL of the page. This looks like: https://www.facebook.com/marketplace/item/916998977756029/
Read it character by character and capture the full URL exactly as "listingUrl". This is the single most important field in this extraction. Do not skip it even if the URL is long or contains query parameters.

STEP 2 — Extract all other visible listing data:
Extract every field you can find. If a field is not visible, omit it (do not include null values).

STEP 3 — CONDITION ASSESSMENT FROM VEHICLE PHOTOS:
If additional vehicle photos were provided (following this message), analyze EACH one carefully for condition. Look at:
- EXTERIOR: Paint condition (scratches, fading, peeling, orange peel), body damage (dents, panel gaps, rust), glass condition, tires (tread depth visible?, brand, wear), lights condition, any modifications
- INTERIOR: Seat condition (rips, stains, wear), dashboard (cracks, fading), steering wheel wear, headliner (sagging?), carpets (stains, wear)
- MECHANICAL: Any warning lights visible, fluid leaks under the vehicle, rust on frame/components, aftermarket modifications, engine bay condition if visible
Write 2-4 detailed sentences for each category. This data directly feeds the vehicle's condition score.

Return ONLY valid JSON with this exact structure:

{
  "listingUrl": "<PRIORITY #1 — full URL copied exactly from the browser address bar at the very top of the screenshot>",
  "year": <number>,
  "make": "<string>",
  "model": "<string>",
  "trim": "<string>",
  "price": <number - clean dollar amount, no symbols>,
  "mileage": <number - clean integer>,
  "vin": "<string - 17 characters if visible>",
  "location": "<City, State>",
  "titleStatus": "<Clean|Salvage|Rebuilt|Lien>",
  "bodyStyle": "<Sedan|SUV|Coupe|Truck|Van|Wagon|Convertible|Hatchback>",
  "condition": "<Excellent|Very Good|Good|Fair|Needs Work>",
  "exteriorColor": "<string>",
  "interiorColor": "<string>",
  "transmission": "<Automatic|Manual|CVT>",
  "fuelType": "<Gasoline|Diesel|Electric|Hybrid|Plug-in Hybrid>",
  "drivetrain": "<FWD|RWD|AWD|4WD>",
  "engine": "<string, e.g. V6 3.3L>",
  "cylinders": <number>,
  "mpg": "<string, e.g. 17 city / 23 hwy / 19 combined>",
  "safetyRating": "<string, e.g. 5/5 overall NHTSA>",
  "seatCount": <number>,
  "numOwners": <number>,
  "paidOff": <boolean>,
  "sellerName": "<string>",
  "description": "<full seller description text>",
  "postedDate": "<string, e.g. Listed 2 days ago>",
  "conditionExterior": "<2-4 detailed sentences about paint, dents, rust, glass, tires, mods — from provided photos>",
  "conditionInterior": "<2-4 detailed sentences about seats, dash, wheel, headliner, carpets, odors — from provided photos>",
  "conditionMechanical": "<2-4 detailed sentences about warning lights, leaks, rust, mods, engine bay — from provided photos>",
  "notableDamage": "<any specific damage noted, or empty string>",
  "overallImpression": "<Excellent|Good|Fair|Poor|Project>"
}

CRITICAL RULES:
- Extract numbers as clean integers/floats (no $ signs, no commas)
- For price, extract the asking price only
- For mileage, extract as a clean integer
- Look at BOTH the structured data fields AND the seller's description text
- If additional vehicle photos were provided, analyze them THOROUGHLY for conditionExterior, conditionInterior, and conditionMechanical — these fields are critical for the vehicle score
- Return ONLY the JSON object, no markdown, no code fences, no explanation`;

const CONDITION_PROMPT = `You are a vehicle condition assessment engine. Analyze this photo of a vehicle and describe what you see in detail.

Focus on:
1. EXTERIOR: Paint condition (scratches, fading, peeling, orange peel), body damage (dents, panel gaps, rust), glass condition, tires (tread depth visible?, brand, wear), lights condition, any modifications
2. INTERIOR: Seat condition (rips, stains, wear), dashboard (cracks, fading), steering wheel wear, headliner (sagging?), carpets (stains, wear), any odors or issues you can infer from visible condition
3. MECHANICAL: Any warning lights visible, fluid leaks under the vehicle, rust on frame/components, aftermarket modifications, engine bay condition if visible

Return ONLY valid JSON:

{
  "exteriorCondition": "<2-3 sentence factual description of exterior condition>",
  "interiorCondition": "<2-3 sentence factual description of interior condition, if visible>",
  "mechanicalCondition": "<2-3 sentence description of any visible mechanical issues, warning lights, or under-hood condition>",
  "notableDamage": "<any specific damage noted, or omit if none>",
  "overallImpression": "<one word: Excellent|Good|Fair|Poor|Project>"
}

CRITICAL RULES:
- Be FACTUAL — describe what you see, do not speculate beyond visible evidence
- If you can't see something (e.g., interior not visible), omit that field entirely
- Return ONLY the JSON object, no markdown, no code fences, no explanation`;

export async function POST(request: Request) {
    // ── Rate Limiting ──
    const ip = getClientIp(request);
    // Use IP as userId for rate limiting
    const rl = await rateLimit(`extract:${ip}`, EXTRACT_LIMIT.max, EXTRACT_LIMIT.windowSec, ip);
    if (!rl.allowed) {
        return NextResponse.json(
            { error: `Rate limit exceeded. You can analyze ${EXTRACT_LIMIT.max} listings per hour. Resets at ${new Date(rl.resetAt).toLocaleTimeString()}.` },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': String(EXTRACT_LIMIT.max),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
                    'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
                }
            }
        );
    }

    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const manualUrl = formData.get('manualUrl') as string | null;
        const mode = (formData.get('mode') as string) || 'listing';

        // Collect additional vehicle photos (keyed as photo0, photo1, etc.)
        const extraPhotos: { file: File; base64: string }[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('photo') && value instanceof File) {
                const ab = await (value as File).arrayBuffer();
                extraPhotos.push({
                    file: value as File,
                    base64: Buffer.from(ab).toString('base64')
                });
            }
        }

        // Enhanced prompt when photos are provided — tell the model to analyze ALL images
        const hasPhotos = extraPhotos.length > 0;
        const enhancedPrompt = hasPhotos
            ? `${EXTRACTION_PROMPT}\n\nADDITIONAL VEHICLE PHOTOS (${extraPhotos.length} images): These are the actual vehicle photos uploaded by the user. Use them to extract detailed condition information, verify the make/model, and identify features not visible in the listing screenshot. Merge all findings into the JSON output.`
            : EXTRACTION_PROMPT;

        // Select prompt based on mode
        const prompt = mode === 'condition' ? CONDITION_PROMPT : enhancedPrompt;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Validate image size (max 5 MB after client resize)
        if (imageFile.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Image too large. Maximum is 5 MB.' },
                { status: 413 }
            );
        }

        // Create sanitized image buffer early (reused by both strategies)
        const arrayBuffer = await imageFile.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Helper: sanitize JSON from LLM (strips bad control chars, code fences)
        const sanitizeJson = (raw: string): string => {
            let s = raw.trim();
            // Remove markdown code fences
            s = s.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');
            // Strip bad control characters that break JSON.parse (except \n, \r, \t)
            s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
            return s.trim();
        };

        // Build the image contents array: screenshot first, then extra photos
        const buildImageContents = (base64Data: string, mimeType: string) => {
            const contents: any[] = [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ];
            // Append extra vehicle photos
            for (const photo of extraPhotos) {
                contents.push({
                    type: 'image_url',
                    image_url: { url: `data:${photo.file.type || 'image/jpeg'};base64,${photo.base64}` }
                });
            }
            return contents;
        };

        // ── STRATEGY A: Groq Llama 4 Scout 17B (vision-capable, LPU-fast) ──
        const groqKey = process.env.GROQ_API_KEY;
        let vehicle: any = null;
        let lastError = '';

        if (groqKey && !groqKey.includes('your_')) {
            try {
                const base64Data = imageBuffer.toString('base64');
                const mimeType = imageFile.type || 'image/png';
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                        messages: [{ role: 'user', content: buildImageContents(base64Data, mimeType) }],
                        temperature: 0.1,
                        max_tokens: 2048,
                    }),
                });

                if (groqRes.ok) {
                    const data = await groqRes.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content && !content.trim().startsWith('<')) {
                        const parsed = JSON.parse(sanitizeJson(content));
                        if (parsed && (parsed.make || parsed.year)) {
                            vehicle = parsed;
                            console.log('[Extract Listing] ✅ Groq Llama 4 Scout:', vehicle.make, vehicle.model);
                        }
                    }
                } else {
                    const errBody = await groqRes.text();
                    lastError = `Groq: ${groqRes.status} — ${errBody.substring(0, 100)}`;
                    console.error('[Extract Listing] Groq error:', groqRes.status, errBody.substring(0, 200));
                }
            } catch (e: any) {
                lastError = `Groq: ${e.message}`;
                console.error('[Extract Listing] Groq exception:', e.message);
            }
        }

        // ── STRATEGY B: Ollama (local fallback) ──
        if (!vehicle) {
            try {
                const { OllamaVisionEngine } = require('@/lib/vision-engine');
                const ollama = new OllamaVisionEngine(process.env.OLLAMA_HOST);
                vehicle = await ollama.extract(imageBuffer, prompt, imageFile.type);
                if (vehicle && (vehicle.make || vehicle.year)) {
                    console.log('[Extract Listing] ✅ Ollama succeeded:', vehicle.make, vehicle.model);
                }
            } catch (e: any) {
                console.warn('[Extract Listing] Ollama not available:', e.message);
                lastError += ' | Ollama: unavailable';
            }
        }

        if (!vehicle) {
            const errorMsg = lastError
                ? `Vision analysis failed across all providers. ${lastError}`
                : 'Vision analysis failed across all providers. Check your GROQ_API_KEY.';
            return NextResponse.json(
                { error: errorMsg, detail: lastError },
                { status: 500 }
            );
        }

        // Inject manual URL — takes priority over vision-extracted URL
        if (manualUrl && manualUrl.trim()) {
            vehicle.listingUrl = manualUrl.trim();
        }

        // Add source metadata
        vehicle.source = 'screenshot-import';

        console.log('[Extract Listing] Successfully extracted:', {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            price: vehicle.price,
            fieldsExtracted: Object.keys(vehicle).length,
        });

        return NextResponse.json({ success: true, vehicle });
    } catch (error: any) {
        console.error('[Extract Listing] Error:', error);

        if (error.message?.includes('JSON')) {
            return NextResponse.json(
                { error: 'Failed to parse listing data. Try a clearer screenshot.' },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to extract listing data' },
            { status: 500 }
        );
    }
}
