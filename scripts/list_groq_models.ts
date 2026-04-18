import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
    envConfig.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) process.env[key.trim()] = val.trim();
    });
}

const groqKey = process.env.GROQ_API_KEY;

async function listModels() {
    if (!groqKey) {
        console.log("❌ No Groq Key found.");
        return;
    }
    try {
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${groqKey}` }
        });
        console.log("Available Groq Models:");
        console.log(JSON.stringify(response.data.data.map((m: any) => m.id), null, 2));
    } catch (e: any) {
        console.error("Error fetching models:", e.message);
    }
}

listModels();
