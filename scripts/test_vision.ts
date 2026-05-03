import * as fs from 'fs';
import * as path from 'path';
import { VisionManager } from '../src/lib/vision-engine';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
    envConfig.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) process.env[key.trim()] = val.trim();
    });
}

const manager = new VisionManager({
    groqKey: process.env.GROQ_API_KEY,
    ollamaHost: process.env.OLLAMA_HOST
});

const EXTRACTION_PROMPT = `Extract vehicle data from this image. Return valid JSON.`;

async function testExtraction() {
    console.log("Testing Unified Vision Manager...");
    // Just a connectivity test first
    const result = await manager.extract(Buffer.from("fake data"), EXTRACTION_PROMPT);
    if (!result) {
        console.log("ℹ️ Extraction returned null (expected if no real image provided).");
    }
}

testExtraction();
