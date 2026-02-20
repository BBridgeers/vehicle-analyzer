import { NextResponse } from 'next/server';
import { scrapeVehicle } from '@/lib/scrapers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'Invalid URL provided' },
                { status: 400 }
            );
        }

        console.log(`[URL Import] Scraping URL: ${url}`);
        const vehicle = await scrapeVehicle(url);

        return NextResponse.json({ success: true, vehicle });
    } catch (error: any) {
        console.error('[URL Import] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to scrape URL' },
            { status: 500 }
        );
    }
}
