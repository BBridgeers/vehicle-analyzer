import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, EXTRACT_LIMIT } from '@/lib/rate-limit';

const EXTRACTION_PROMPT = `You are a vehicle listing data extraction engine. Analyze this screenshot of a vehicle listing (likely from Facebook Marketplace or similar) and extract ALL visible information into structured JSON.

STEP 1 — READ THE BROWSER ADDRESS BAR FIRST:
Before reading any listing content, look at the very top of the screenshot. There will be a browser address bar (Chrome/Edge/Firefox) showing the full URL of the page. This looks like: https://www.facebook.com/marketplace/item/916998977756029/
Read it character by character and capture the full URL exactly as "listingUrl". This is the single most important field in this extraction. Do not skip it even if the URL is long or contains query parameters.

STEP 2 — Extract all other visible listing data:
Extract every field you can find. If a field is not visible, omit it (do not include null values).

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
  "seatCount": <number - total number of seats, e.g. 5 for most sedans, 7 for SUVs with 3rd row>,
  "numOwners": <number>,
  "paidOff": <boolean - true if listing says vehicle is paid off>,
  "sellerName": "<string>",
  "description": "<full seller description text>",
  "postedDate": "<string, e.g. Listed 2 days ago>",
  "conditionExterior": "<any visible exterior damage, mods, or notable features from photos>",
  "conditionInterior": "<any visible interior wear, damage, or notable features from photos>"
}

CRITICAL RULES:
- Extract numbers as clean integers/floats (no $ signs, no commas)
- For price, extract the asking price only
- For mileage, extract as a clean integer
- Look at BOTH the structured data fields AND the seller's description text
- Look at the vehicle photos visible in the screenshot for condition notes
- Return ONLY the JSON object, no markdown, no code fences, no explanation`;

export async function POST(request: Request) {
    // ── Rate Limiting ──
    const ip = getClientIp(request);
    const rl = await rateLimit(`extract:${ip}`, EXTRACT_LIMIT.max, EXTRACT_LIMIT.windowSec);
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

        // Convert File to Buffer for vision engines
        const arrayBuffer = await imageFile.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // ── STRATEGY A: Groq Vision (primary, fast) ──
        const groqKey = process.env.GROQ_API_KEY;
        let vehicle: any = null;
        let lastError = '';

        if (groqKey && !groqKey.includes('your_')) {
            try {
                const base64Data = imageBuffer.toString('base64');
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'text', text: EXTRACTION_PROMPT },
                                { type: 'image_url', image_url: { url: `data:${imageFile.type || 'image/png'};base64,${base64Data}` } }
                            ]
                        }],
                        temperature: 0.1,
                        max_tokens: 2048,
                    }),
                });

                if (groqRes.ok) {
                    const data = await groqRes.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        const parsed = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
                        if (parsed && (parsed.make || parsed.year)) {
                            vehicle = parsed;
                            console.log('[Extract Listing] ✅ Groq succeeded:', vehicle.make, vehicle.model);
                        }
                    }
                } else {
                    const errBody = await groqRes.text();
                    console.error('[Extract Listing] Groq API error:', groqRes.status, errBody.substring(0, 300));
                    lastError = `Groq: ${groqRes.status} — ${errBody.substring(0, 100)}`;
                }
            } catch (e: any) {
                console.error('[Extract Listing] Groq exception:', e.message);
                lastError = `Groq: ${e.message}`;
            }
        }

        // ── STRATEGY B: OpenRouter fallback (any vision-capable model) ──
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!vehicle && openRouterKey) {
            try {
                const base64Data = imageBuffer.toString('base64');
                const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://www.veracar.co',
                        'X-Title': 'Vehicle Analyzer Pro',
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-2.5-flash-lite',
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'text', text: EXTRACTION_PROMPT },
                                { type: 'image_url', image_url: { url: `data:${imageFile.type || 'image/png'};base64,${base64Data}` } }
                            ]
                        }],
                        temperature: 0.1,
                        max_tokens: 2048,
                    }),
                });

                if (orRes.ok) {
                    const data = await orRes.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        const parsed = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
                        if (parsed && (parsed.make || parsed.year)) {
                            vehicle = parsed;
                            console.log('[Extract Listing] ✅ OpenRouter succeeded:', vehicle.make, vehicle.model);
                        }
                    }
                } else {
                    const errBody = await orRes.text();
                    console.error('[Extract Listing] OpenRouter error:', orRes.status, errBody.substring(0, 300));
                    lastError += ` | OpenRouter: ${orRes.status}`;
                }
            } catch (e: any) {
                console.error('[Extract Listing] OpenRouter exception:', e.message);
                lastError += ` | OpenRouter: ${e.message}`;
            }
        }

        // ── STRATEGY C: Ollama (local fallback) ──
        if (!vehicle) {
            try {
                const { OllamaVisionEngine } = require('@/lib/vision-engine');
                const ollama = new OllamaVisionEngine(process.env.OLLAMA_HOST);
                vehicle = await ollama.extract(imageBuffer, EXTRACTION_PROMPT, imageFile.type);
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
                : 'Vision analysis failed across all providers. Check your API keys and verify GROQ_API_KEY or OPENROUTER_API_KEY is set.';
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
