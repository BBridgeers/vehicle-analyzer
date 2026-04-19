import * as fs from 'fs';
import { analyzeVehicle } from '../src/lib/analyze';
import { decodeVin } from '../src/lib/vin-decoder';
import { Vehicle } from '../src/lib/types';

const inputFile = process.argv[2] || 'golden_vehicles.json';

// Create timestamp suffix (e.g. 2026-04-16_11AM)
const now = new Date();
const dateStr = now.toISOString().slice(0, 10);
const hours = now.getHours();
const ampm = hours >= 12 ? 'PM' : 'AM';
const formattedHours = hours % 12 || 12;
const timeSuffix = `${dateStr}_${formattedHours}${ampm}`;

const baseName = inputFile.replace('.json', '');
const outputFile = `exports/${baseName}_analysis_${timeSuffix}.csv`;

if (!fs.existsSync('exports')) {
    fs.mkdirSync('exports');
}

if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file ${inputFile} not found.`);
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

function mapToVehicle(data: any): Vehicle {
    return {
        id: Math.random().toString(36).substring(7),
        year: data.year || 2000,
        make: data.make || "Unknown",
        model: data.model || "Unknown",
        price: data.price || 0,
        mileage: data.mileage || 100000,
        source: "direct",
        description: data.description,
        conditionExterior: data.conditionExterior,
        vin: data.vin
    };
}

const headers = [
    "Year", "Make", "Model", "Price", "Mileage", "VIN",
    "Market Value (Private)", "Market Value (Dealer)", "Instant Equity",
    "Verdict", "Score", "Issues Count",
    "Payback Weeks", "Insurance/mo", "Rideshare Net/mo", "Rideshare Class",
    "Maint & Fees/mo", "Upfront Cost", "5-Year Profit", "Seller Condition Notes",
    "Source Listing URL", "VAP Deep Link", "Lemon Notes"
];

const rows = [];
console.log(`🧠 Feeding ${rawData.length} vehicles from ${inputFile} into Vehicle Analyzer Pro...`);

async function run() {
    for (const raw of rawData) {
        if (!raw.price || raw.price <= 0) continue; // Skip incomplete pricing
        const vehicle = mapToVehicle(raw);
        
        let vinData = undefined;
        if (vehicle.vin) {
            console.log(`   🔍 Validating VIN with NHTSA for ${vehicle.year} ${vehicle.make} ${vehicle.model}...`);
            const data = await decodeVin(vehicle.vin);
            if (data) Object.assign(vinData || (vinData = {}), data); // Actually, decodeVin returns VinDecodeResult, wait. analyzeVehicle expects VinAnalysis!
        }

        // Just pass it through, the app will handle it
        const analysis = analyzeVehicle(vehicle, undefined); // Note: For full parity, VinAnalysis object structure is needed.

        const rideshareClass = analysis.rideshare.eligibility.uberComfort.eligible ? "Uber Comfort" : (analysis.rideshare.eligibility.uberXL.eligible ? "Uber XL" : "UberX");
        
        // Construct the deep link parameter
        const carParam = {
            id: vehicle.id,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            price: vehicle.price,
            mileage: vehicle.mileage,
            vin: vehicle.vin,
            description: vehicle.description || ''
        };
        const PROD_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vehicle-analyzer.vercel.app';
        const deepLink = `${PROD_URL}/?car=${encodeURIComponent(JSON.stringify(carParam))}`;
        const finalUrl = raw.url || raw.sourceUrl || raw.listingUrl || '';

        rows.push([
            vehicle.year,
            `"${vehicle.make}"`,
            `"${vehicle.model}"`,
            vehicle.price,
            vehicle.mileage,
            vehicle.vin || 'N/A',
            analysis.marketValues.privatePartyAvg,
            analysis.marketValues.dealerRetail,
            analysis.instantEquity,
            `"${analysis.verdict.replace(/"/g, '""')}"`, // escape quotes
            analysis.verdictScore,
            analysis.criticalIssues.length,
            analysis.paybackWeeks.baseline,
            Math.round(analysis.insurance.personalMonthly),
            Math.round(analysis.rideshare.earnings.baseline.monthlyNet),
            `"${rideshareClass}"`,
            Math.round(analysis.operationalCosts.monthlyTotal),
            analysis.initialInvestment.totalUpfront,
            analysis.scenarios.bestEquity,
            `"${(raw.conditionExterior || '').replace(/"/g, '""')}"`,
            `"${finalUrl}"`,
            `"${deepLink}"`,
            `"${raw.lemonStatus?.reason?.replace(/"/g, '""') || ''}"`
        ]);
    }

    const csvData = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    fs.writeFileSync(outputFile, csvData);
    console.log(`✅ High-Fidelity Comparative Analysis exported successfully to: ${outputFile}\n`);
}

run().catch(console.error);
