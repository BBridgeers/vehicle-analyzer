import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

// ── TYPES & INTERFACES ──

export interface VisionResult {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    price?: number;
    mileage?: number;
    titleStatus?: string;
    sellerType?: string;
    lemonStatus?: {
        isLemon: boolean;
        reason: string | null;
    };
    description?: string;
    conditionExterior?: string;
    vin?: string;
    location?: string;
    bodyStyle?: string;
    condition?: string;
    exteriorColor?: string;
    interiorColor?: string;
    transmission?: string;
    fuelType?: string;
    drivetrain?: string;
    engine?: string;
    cylinders?: number;
    mpg?: string;
    safetyRating?: string;
    numOwners?: number;
    paidOff?: boolean;
    sellerName?: string;
    postedDate?: string;
    conditionInterior?: string;
    listingUrl?: string;
    source?: string;
}

export interface IVisionEngine {
    name: string;
    extract(imageBuffer: Buffer | string, prompt: string, mimeType?: string): Promise<VisionResult | null>;
}

// ── UTILS ──

function parseRobustJSON(text: string): any {
    try {
        let jsonStr = text.trim();
        // Remove markdown formatting
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("[Vision Engine] JSON Parse Error:", e);
        return null;
    }
}

// ── ENGINES ──

export class GeminiVisionEngine implements IVisionEngine {
    name = "Gemini";
    private ai: any;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.ai = new GoogleGenAI({ apiKey });
        }
    }

    async extract(image: Buffer | string, prompt: string, mimeType: string = 'image/png'): Promise<VisionResult | null> {
        if (!this.ai) return null;
        try {
            const base64Data = Buffer.isBuffer(image) ? image.toString('base64') : image.replace(/^data:image\/\w+;base64,/, '');
            
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64Data,
                        },
                    },
                    { text: prompt }
                ],
                config: { temperature: 0.1 }
            });
            
            return parseRobustJSON(response.text || "{}");
        } catch (e: any) {
            console.error("Gemini Error:", e.message);
            return null;
        }
    }
}

export class GroqVisionEngine implements IVisionEngine {
    name = "Groq";
    private apiKey?: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
    }

    async extract(image: Buffer | string, prompt: string): Promise<VisionResult | null> {
        if (!this.apiKey || this.apiKey.includes('your_')) return null;
        try {
            const base64Data = Buffer.isBuffer(image) ? image.toString('base64') : image.replace(/^data:image\/\w+;base64,/, '');
            
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: { url: `data:image/png;base64,${base64Data}` }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
            });

            const content = response.data.choices[0].message.content;
            return content ? parseRobustJSON(content) : null;
        } catch (e: any) {
            console.error("Groq Error:", e.response?.data || e.message);
            return null;
        }
    }
}

export class OllamaVisionEngine implements IVisionEngine {
    name = "Ollama";
    private host: string;

    constructor(host: string = 'http://localhost:11434') {
        this.host = host;
    }

    async extract(image: Buffer | string, prompt: string): Promise<VisionResult | null> {
        try {
            const base64Data = Buffer.isBuffer(image) ? image.toString('base64') : image.replace(/^data:image\/\w+;base64,/, '');
            
            const response = await axios.post(`${this.host}/api/generate`, {
                model: 'llama3.2-vision',
                prompt: prompt,
                images: [base64Data],
                stream: false,
                format: 'json',
                options: { temperature: 0.1 }
            });

            return response.data.response ? parseRobustJSON(response.data.response) : null;
        } catch (e: any) {
            console.warn("[Vision Engine] Ollama not reachable.");
            return null;
        }
    }
}

export class VisionManager {
    private engines: IVisionEngine[];

    constructor(configs: { geminiKey?: string; groqKey?: string; ollamaHost?: string }) {
        this.engines = [];
        if (configs.groqKey) this.engines.push(new GroqVisionEngine(configs.groqKey));
        if (configs.geminiKey) this.engines.push(new GeminiVisionEngine(configs.geminiKey));
        this.engines.push(new OllamaVisionEngine(configs.ollamaHost));
    }

    async extract(image: Buffer | string, prompt: string, mimeType?: string): Promise<VisionResult | null> {
        for (const engine of this.engines) {
            console.log(`[Vision Manager] Attempting extraction with ${engine.name}...`);
            const result = await engine.extract(image, prompt, mimeType);
            if (result && (result.make || result.year)) {
                console.log(`[Vision Manager] ✅ Success with ${engine.name}`);
                return result;
            }
            console.log(`[Vision Manager] ❌ ${engine.name} failed or skipped.`);
        }
        return null;
    }
}
