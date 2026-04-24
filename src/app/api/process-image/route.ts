import { NextResponse } from 'next/server';
import { AntigravityEngine } from '@/lib/antigravity';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert image to base64
        const arrayBuffer = await image.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${image.type};base64,${base64Image}`;

        // Use AntigravityEngine for vision processing
        const engine = new AntigravityEngine('PROCESS_IMAGE');
        const result = await engine.processVisionInput(dataUrl);

        return NextResponse.json({
            vin: result.vin,
            year: result.year,
            make: result.make,
            model: result.model,
            price: result.price,
            mileage: result.mileage,
        });
    } catch (error: any) {
        console.error("Image Process Error:", error);
        return NextResponse.json({ error: "Image Processing Failed" }, { status: 500 });
    }
}
