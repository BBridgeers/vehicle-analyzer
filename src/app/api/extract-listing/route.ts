import { NextResponse } from 'next/server';

const EXTRACTION_PROMPT = `You are a vehicle listing data extraction engine. Analyze this screenshot of a vehicle listing (likely from Facebook Marketplace or similar) and extract ALL visible information into structured JSON.

Extract every field you can find. If a field is not visible or not present, omit it entirely (do not include null values).

Return ONLY valid JSON with this exact structure (all fields optional except year, make, model, price):

{
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
  "numOwners": <number>,
  "paidOff": <boolean - true if listing says vehicle is paid off>,
  "sellerName": "<string>",
  "description": "<full seller description text>",
  "postedDate": "<string, e.g. Listed 2 days ago>",
  "conditionExterior": "<any visible exterior damage, mods, or notable features from photos>",
  "conditionInterior": "<any visible interior wear, damage, or notable features from photos>",
  "listingUrl": "<if URL bar is visible in screenshot>"
}

CRITICAL RULES:
- Extract numbers as clean integers/floats (no $ signs, no commas)
- For price, extract the asking price only
- For mileage, extract as a clean integer
- Look at BOTH the structured data fields AND the seller's description text
- Look at the vehicle photos visible in the screenshot for condition notes
- If you see the URL bar in the screenshot, capture the listing URL
- Return ONLY the JSON object, no markdown, no code fences, no explanation`;

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GeminiKey;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { image, mimeType } = body;

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        // Strip data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType || 'image/png',
                        data: base64Data,
                    },
                },
                { text: EXTRACTION_PROMPT }
            ],
            config: {
                temperature: 0.1,
            }
        });

        const text = response.text;

        // Parse JSON from the response (handle potential markdown code fences)
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }

        const vehicle = JSON.parse(jsonStr);

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
