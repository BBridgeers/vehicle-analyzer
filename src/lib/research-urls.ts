/**
 * Generate research URLs for a specific vehicle.
 * Used by the Action Plan but also exported for standalone use.
 */

export interface ResearchLink {
    label: string;
    url: string;
    category: "history" | "value" | "reviews" | "problems" | "community";
}

export function generateResearchUrls(
    year: number,
    make: string,
    model: string,
    vin?: string
): ResearchLink[] {
    const encodedYMM = encodeURIComponent(`${year} ${make} ${model}`);
    const makeLower = make.toLowerCase();
    const modelSlug = model.toLowerCase().replace(/\s+/g, "-");

    const links: ResearchLink[] = [];

    // VIN-based (only if VIN provided)
    if (vin) {
        links.push(
            {
                label: "🚗 Carfax VIN Report",
                url: `https://www.carfax.com/VehicleHistory/p/Report.cfx?vin=${vin}`,
                category: "history",
            },
            {
                label: "🔍 AutoCheck VIN Report",
                url: `https://www.autocheck.com/vehiclehistory/autocheck/en/search-results?vin=${vin}`,
                category: "history",
            },
            {
                label: "📋 NHTSA VIN Decode",
                url: `https://vpic.nhtsa.dot.gov/decoder/Decoder/DecodeVin/${vin}`,
                category: "history",
            }
        );
    }

    // Value lookup
    links.push(
        {
            label: "📊 KBB Value",
            url: `https://www.kbb.com/${makeLower}/${modelSlug}/${year}/`,
            category: "value",
        },
        {
            label: "💰 Edmunds Value",
            url: `https://www.edmunds.com/${makeLower}/${modelSlug}/${year}/appraisal/`,
            category: "value",
        },
        {
            label: "📈 NADA Guides",
            url: `https://www.nadaguides.com/Cars/${year}/${make}/${model}`,
            category: "value",
        }
    );

    // Reviews
    links.push(
        {
            label: "📰 Edmunds Review",
            url: `https://www.edmunds.com/${makeLower}/${modelSlug}/${year}/review/`,
            category: "reviews",
        },
        {
            label: "⭐ Consumer Reports",
            url: `https://www.consumerreports.org/cars/${makeLower}/${modelSlug}/${year}/`,
            category: "reviews",
        },
        {
            label: "🏎️ Car and Driver",
            url: `https://www.caranddriver.com/${makeLower}/${modelSlug}`,
            category: "reviews",
        }
    );

    // Problems / complaints
    links.push(
        {
            label: "🔍 NHTSA Complaints",
            url: `https://www.nhtsa.gov/vehicle/${year}/${encodeURIComponent(make)}/${encodeURIComponent(model)}`,
            category: "problems",
        },
        {
            label: "⚙️ CarComplaints.com",
            url: `https://www.carcomplaints.com/${makeLower}/${modelSlug}/${year}/`,
            category: "problems",
        },
        {
            label: "🔎 Google: Common Problems",
            url: `https://www.google.com/search?q=${encodedYMM}+common+problems+issues+reliability`,
            category: "problems",
        }
    );

    // Community
    links.push(
        {
            label: "💬 Reddit",
            url: `https://www.reddit.com/search/?q=${encodedYMM}+reliability+problems`,
            category: "community",
        },
        {
            label: "🗣️ Owner Forums",
            url: `https://www.google.com/search?q=${encodedYMM}+forum+owners`,
            category: "community",
        }
    );

    return links;
}
