import type { Vehicle, CriticalIssue, MarketValues } from "./types";

/**
 * Pre-Purchase Action Plan: 5-step checklist with dynamic research URLs.
 */

export interface ActionStep {
    step: number;
    title: string;
    description: string;
    links: { label: string; url: string }[];
    priority: "critical" | "high" | "medium";
}

export interface ActionPlan {
    steps: ActionStep[];
    researchUrls: { label: string; url: string }[];
}

export function generateActionPlan(
    vehicle: Vehicle,
    _marketValues: MarketValues,
    issues: CriticalIssue[]
): ActionPlan {
    const { year, make, model, vin } = vehicle;
    const ymm = `${year} ${make} ${model}`;
    const encodedYMM = encodeURIComponent(ymm);

    const hasCriticalIssues = issues.some((i) => i.severity === "critical");

    const researchUrls = [
        {
            label: "🔍 NHTSA Complaints",
            url: `https://www.nhtsa.gov/vehicle/${year}/${encodeURIComponent(make)}/${encodeURIComponent(model)}`,
        },
        {
            label: "📊 KBB Value Lookup",
            url: `https://www.kbb.com/${make.toLowerCase()}/${model.toLowerCase().replace(/\s+/g, "-")}/${year}/`,
        },
        {
            label: "📰 Edmunds Review",
            url: `https://www.edmunds.com/${make.toLowerCase()}/${model.toLowerCase().replace(/\s+/g, "-")}/${year}/review/`,
        },
        {
            label: "⭐ Consumer Reports",
            url: `https://www.consumerreports.org/cars/${make.toLowerCase()}/${model.toLowerCase().replace(/\s+/g, "-")}/${year}/reliability/`,
        },
        {
            label: "🔎 Google: Common Problems",
            url: `https://www.google.com/search?q=${encodedYMM}+common+problems+issues`,
        },
        {
            label: "💬 Reddit Discussions",
            url: `https://www.reddit.com/search/?q=${encodedYMM}+reliability`,
        },
    ];

    if (vin) {
        researchUrls.unshift(
            {
                label: "🚗 Carfax VIN Check",
                url: `https://www.carfax.com/VehicleHistory/p/Report.cfx?vin=${vin}`,
            },
            {
                label: "🔍 AutoCheck VIN",
                url: `https://www.autocheck.com/vehiclehistory/autocheck/en/search-results?vin=${vin}`,
            },
            {
                label: "📋 NHTSA VIN Decode",
                url: `https://vpic.nhtsa.dot.gov/decoder/Decoder/DecodeVin/${vin}`,
            }
        );
    }

    const steps: ActionStep[] = [
        {
            step: 1,
            title: "Run VIN History Reports",
            description: vin
                ? `Run BOTH Carfax AND AutoCheck for VIN: ${vin}. They use different databases and may reveal different histories.`
                : "Request VIN from seller immediately. Do NOT proceed without a VIN check.",
            links: vin
                ? researchUrls.filter((u) => u.label.includes("Carfax") || u.label.includes("AutoCheck"))
                : [],
            priority: "critical",
        },
        {
            step: 2,
            title: "Contact Seller & Ask Key Questions",
            description: `Ask: (1) Why selling? (2) How long owned? (3) Any accidents? (4) Maintenance records? (5) Will they allow PPI at your mechanic?${hasCriticalIssues ? " ⚠️ Critical issues detected — ask pointed questions about them." : ""}`,
            links: vehicle.listingUrl
                ? [{ label: "📌 Open Listing", url: vehicle.listingUrl }]
                : [],
            priority: "high",
        },
        {
            step: 3,
            title: "Schedule Pre-Purchase Inspection (PPI)",
            description: `Find a trusted independent mechanic near ${vehicle.location || "your area"}. Budget $100-$200. Insist on: compression test, transmission fluid check, suspension inspection, brake measurement.`,
            links: [
                {
                    label: "🔧 Find Mechanic (Google)",
                    url: `https://www.google.com/search?q=pre+purchase+vehicle+inspection+near+${encodeURIComponent(vehicle.location || "Dallas TX")}`,
                },
            ],
            priority: "high",
        },
        {
            step: 4,
            title: "Physical Inspection & Test Drive",
            description: "Check: cold start behavior, unusual noises, steering alignment, brake feel, AC function, all electronics. Test drive for 20+ minutes including highway speeds.",
            links: [],
            priority: "high",
        },
        {
            step: 5,
            title: "Negotiate & Close",
            description: "Use market data and any discovered issues as leverage. Have your target price, opening offer, and walk-away price ready before arriving.",
            links: [],
            priority: "medium",
        },
    ];

    return { steps, researchUrls };
}
