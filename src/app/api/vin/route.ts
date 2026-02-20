import { NextResponse } from 'next/server';
import { AntigravityEngine } from '@/lib/antigravity';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Pro limit

export async function POST(req: Request) {
    try {
        const { vin } = await req.json();

        if (!vin) {
            return NextResponse.json({ error: "VIN required" }, { status: 400 });
        }

        const engine = new AntigravityEngine(vin);
        const result = await engine.runAnalysis();

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Analysis Timed Out or Failed" }, { status: 504 });
    }
}
