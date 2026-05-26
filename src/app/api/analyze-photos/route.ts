import { NextResponse } from 'next/server';
import { MASTER_INSPECTOR_KNOWLEDGE } from '@/lib/master-inspector';

const PHOTO_ANALYSIS_PROMPT = `You are an expert vehicle identification AND condition assessment system.

${MASTER_INSPECTOR_KNOWLEDGE}

═══════════════════════════════════════════
PHOTO ANALYSIS TASK:
═══════════════════════════════════════════
Analyze these vehicle photos and return BOTH vehicle identity AND detailed condition information. Use the terminology and grading standards from the Master Assessor Protocol above.
Look for:
- Brand badges and logos (front grille, rear, steering wheel, wheels)
- Model badges (rear, sides, tailgate)
- Body style (sedan, SUV, coupe, truck, wagon, convertible, hatchback, van)
- Generation-specific design cues (headlights, taillights, grille shape, body lines) that narrow the year range
- Trim badges (e.g., "Limited", "Sport", "LX", "XLE", "Platinum", "TRD")
- Color (exterior, interior if visible)
- Any visible text or labels on the vehicle
- Wheels, exhaust, and other trim-level indicators

═══════════════════════════════════════════
PART 2 — CONDITION ASSESSMENT (EVERY PHOTO)
═══════════════════════════════════════════
Analyze EVERY photo for condition issues. Be specific and detailed — this data directly feeds the vehicle score.

EXTERIOR — Look at paint, body, glass, tires, lights:
- Paint: scratches, swirl marks, fading, peeling clear coat, orange peel, color mismatch between panels
- Body: dents (size/location), panel gaps (uneven?), rust (surface or structural?), missing trim
- Glass: cracks, chips, windshield condition
- Tires: tread depth (good/medium/bald), brand, even wear?, dry rot?
- Lights: fogging, cracks, aftermarket mods
- Modifications: aftermarket wheels, body kits, window tint bubbling
Write 2-4 specific, factual sentences.

INTERIOR — Look at seats, dash, controls, headliner, carpets:
- Seats: rips, tears, stains, bolster wear, leather cracking, foam showing
- Dashboard: cracks, fading, warping, check engine light visible?
- Steering wheel: wear on rim, peeling
- Headliner: sagging, stains, water damage
- Carpets/mats: stains, wear patterns, holes
- Controls: missing knobs, screen condition, warning lights on dash
Write 2-4 specific, factual sentences.

MECHANICAL — Look at engine bay, undercarriage, visible mechanicals:
- Engine bay: cleanliness, fluid leaks, corrosion on battery, belt condition, aftermarket intake/exhaust
- Undercarriage: rust on frame/components, fluid drips, exhaust condition
- Warning lights: any illuminated on the dashboard
- Fluid leaks: puddles under vehicle, wet spots on engine
Write 2-4 specific, factual sentences.

NOTABLE DAMAGE — List any specific damage found: "large dent on driver door", "cracked windshield", "rear bumper scuffed", etc.

OVERALL IMPRESSION — One of: Excellent, Good, Fair, Poor, Project

Return ONLY valid JSON with this exact structure:

{
  "year": <number — best estimate>,
  "make": "<string>",
  "model": "<string>",
  "trim": "<string or empty>",
  "bodyStyle": "<Sedan|SUV|Coupe|Truck|Wagon|Convertible|Hatchback|Van>",
  "exteriorColor": "<string>",
  "interiorColor": "<string or empty>",
  "yearRange": "<string — e.g. '2018-2022' explaining the generation>",
  "confidence": "<high|medium|low>",
  "notes": "<string — identification cues>",
  "conditionExterior": "<2-4 specific, factual sentences about paint, dents, rust, glass, tires>",
  "conditionInterior": "<2-4 specific, factual sentences about seats, dash, wheel, headliner, carpets>",
  "conditionMechanical": "<2-4 specific, factual sentences about engine bay, leaks, rust, warning lights>",
  "notableDamage": "<string of specific damage found, or empty>",
  "overallImpression": "<Excellent|Good|Fair|Poor|Project>"
}

CRITICAL: Return ONLY the JSON object. No markdown, no code fences, no explanation text before or after.`;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const photoFiles: File[] = [];

        // Collect all photo files
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('photo') && value instanceof File) {
                photoFiles.push(value);
            }
        }

        if (photoFiles.length === 0) {
            return NextResponse.json({ error: 'No photos provided' }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
        }

        // Convert all photos to base64
        const imageContents: any[] = [];
        for (const file of photoFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            imageContents.push({
                type: 'image_url',
                image_url: { url: `data:${file.type || 'image/jpeg'};base64,${base64Data}` }
            });
        }

        // Add the text prompt
        const messages = [{
            role: 'user',
            content: [
                ...imageContents,
                { type: 'text', text: PHOTO_ANALYSIS_PROMPT }
            ]
        }];

        // Strategy: Groq Llama 4 Scout 17B (vision-capable)
        let vehicle: any = null;
        let lastError = '';

        // Helper: sanitize JSON from LLM (strips bad control chars, code fences)
        const sanitizeJson = (raw: string): string => {
            let s = raw.trim();
            s = s.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');
            s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
            return s.trim();
        };

        if (groqKey && !groqKey.includes('your_')) {
            try {
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                        messages,
                        temperature: 0.1,
                        max_tokens: 1024,
                    }),
                });

                if (groqRes.ok) {
                    const data = await groqRes.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content && !content.trim().startsWith('<')) {
                        vehicle = JSON.parse(sanitizeJson(content));
                        console.log('[Analyze Photos] ✅ Groq Llama 4 Scout:', vehicle.make, vehicle.model, '| cond:', vehicle.conditionExterior ? 'yes' : 'no');
                    }
                } else {
                    const errBody = await groqRes.text();
                    lastError = `Groq: ${groqRes.status}`;
                    console.error('[Analyze Photos] Groq error:', errBody.substring(0, 200));
                }
            } catch (e: any) {
                lastError = `Groq: ${e.message}`;
            }
        }

        if (!vehicle) {
            return NextResponse.json(
                { error: `Photo analysis failed. ${lastError}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, vehicle });

    } catch (error: any) {
        console.error('[Analyze Photos] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze photos' },
            { status: 500 }
        );
    }
}
