// =====================================================
// IMPORT PARSERS — CSV / JSON / Markdown → Vehicle[]
// =====================================================

import type { Vehicle } from "./types";

export interface ParseResult {
    vehicles: Vehicle[];
    errors: string[];
    format: "csv" | "json" | "markdown" | "unknown";
}

// ── Auto-detect and parse ──

export function parseImportFile(content: string, filename: string): ParseResult {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "json") return parseJSON(content);
    if (ext === "csv") return parseCSV(content);
    if (ext === "md" || ext === "markdown") return parseMarkdown(content);

    // Try auto-detect by content
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return parseJSON(content);
    if (trimmed.startsWith("# ") || trimmed.includes("## Basic Information")) return parseMarkdown(content);
    if (trimmed.includes(",") && trimmed.includes("\n")) return parseCSV(content);

    return { vehicles: [], errors: ["Unsupported file format. Use .csv, .json, or .md files."], format: "unknown" };
}

// ── CSV Parser ──

function parseCSV(content: string): ParseResult {
    const errors: string[] = [];
    const vehicles: Vehicle[] = [];

    const lines = content.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
        return { vehicles: [], errors: ["CSV must have a header row and at least one data row."], format: "csv" };
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

    // Map common header names to Vehicle fields
    const fieldMap: Record<string, keyof Vehicle> = {
        "year": "year",
        "make": "make",
        "model": "model",
        "trim": "trim",
        "price": "price",
        "listing price": "price",
        "listingprice": "price",
        "mileage": "mileage",
        "odometer": "mileage",
        "vin": "vin",
        "location": "location",
        "city": "location",
        "title status": "titleStatus",
        "titlestatus": "titleStatus",
        "title": "titleStatus",
        "seats": "seats",
        "exterior color": "exteriorColor",
        "exteriorcolor": "exteriorColor",
        "ext color": "exteriorColor",
        "interior color": "interiorColor",
        "interiorcolor": "interiorColor",
        "int color": "interiorColor",
        "transmission": "transmission",
        "trans": "transmission",
        "fuel type": "fuelType",
        "fueltype": "fuelType",
        "fuel": "fuelType",
        "source": "source",
        "listing url": "listingUrl",
        "listingurl": "listingUrl",
        "url": "listingUrl",
        "description": "description",
        "posted date": "postedDate",
        "posteddate": "postedDate",
        "date": "postedDate",
    };

    const columnMapping: (keyof Vehicle | null)[] = headers.map((h) => fieldMap[h] ?? null);

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const v: Partial<Vehicle> = {};

        for (let j = 0; j < values.length && j < columnMapping.length; j++) {
            const field = columnMapping[j];
            if (!field) continue;

            const raw = values[j].trim();
            if (!raw) continue;

            if (field === "year" || field === "mileage" || field === "seats") {
                const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
                if (!isNaN(num)) (v as Record<string, unknown>)[field] = num;
            } else if (field === "price") {
                const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
                if (!isNaN(num)) v.price = num;
            } else {
                (v as Record<string, unknown>)[field] = raw;
            }
        }

        // Validate required fields
        if (!v.year || !v.make || !v.model || !v.price) {
            errors.push(`Row ${i + 1}: Missing required field(s) — need Year, Make, Model, and Price.`);
            continue;
        }

        vehicles.push({
            year: v.year,
            make: v.make,
            model: v.model,
            price: v.price,
            mileage: v.mileage ?? 0,
            ...v,
        } as Vehicle);
    }

    return { vehicles, errors, format: "csv" };
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// ── JSON Parser ──

function parseJSON(content: string): ParseResult {
    const errors: string[] = [];
    const vehicles: Vehicle[] = [];

    try {
        const parsed = JSON.parse(content);
        const items: unknown[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.vehicles)
                ? parsed.vehicles
                : [parsed];

        for (let i = 0; i < items.length; i++) {
            const raw = items[i] as Record<string, unknown>;
            const v = mapJsonToVehicle(raw);
            if (!v.year || !v.make || !v.model || !v.price) {
                errors.push(`Item ${i + 1}: Missing required field(s) — need year, make, model, price.`);
                continue;
            }
            vehicles.push(v);
        }
    } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`);
    }

    return { vehicles, errors, format: "json" };
}

function mapJsonToVehicle(raw: Record<string, unknown>): Vehicle {
    const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : undefined);
    const num = (k: string) => {
        const v = raw[k];
        if (typeof v === "number") return v;
        if (typeof v === "string") {
            const n = parseFloat(v.replace(/[^0-9.]/g, ""));
            return isNaN(n) ? undefined : n;
        }
        return undefined;
    };

    return {
        year: num("year") ?? 0,
        make: str("make") ?? "",
        model: str("model") ?? "",
        trim: str("trim"),
        price: num("price") ?? num("listing_price") ?? num("listingPrice") ?? 0,
        mileage: num("mileage") ?? num("odometer") ?? 0,
        vin: str("vin"),
        location: str("location") ?? str("city"),
        titleStatus: str("titleStatus") ?? str("title_status") ?? str("title"),
        seats: num("seats") as number | undefined,
        exteriorColor: str("exteriorColor") ?? str("exterior_color") ?? str("ext_color"),
        interiorColor: str("interiorColor") ?? str("interior_color") ?? str("int_color"),
        transmission: str("transmission"),
        fuelType: str("fuelType") ?? str("fuel_type") ?? str("fuel"),
        source: str("source"),
        listingUrl: str("listingUrl") ?? str("listing_url") ?? str("url"),
        description: str("description"),
        postedDate: str("postedDate") ?? str("posted_date") ?? str("date"),
    };
}

// ── Markdown Template Parser ──

function parseMarkdown(content: string): ParseResult {
    const errors: string[] = [];
    const vehicles: Vehicle[] = [];

    // Check if it is a multi-vehicle markdown (multiple "# Vehicle" or "## Basic Information" blocks)
    const blocks = content.split(/(?=^# Vehicle Listing Data)/gm).filter((b) => b.trim());

    if (blocks.length === 0) {
        // Treat as single vehicle
        blocks.push(content);
    }

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const v = parseMdBlock(block);

        if (!v.year || !v.make || !v.model || !v.price) {
            errors.push(`Block ${i + 1}: Missing required field(s) — need Year, Make, Model, Price.`);
            continue;
        }

        vehicles.push(v);
    }

    return { vehicles, errors, format: "markdown" };
}

function parseMdBlock(block: string): Vehicle {
    const fieldMap: Record<string, keyof Vehicle> = {
        "posted date": "postedDate",
        "date": "postedDate",
        "location": "location",
        "city": "location",
        "year": "year",
        "make": "make",
        "model": "model",
        "trim": "trim",
        "price": "price",
        "listing price": "price",
        "mileage": "mileage",
        "odometer": "mileage",
        "exterior color": "exteriorColor",
        "interior color": "interiorColor",
        "transmission": "transmission",
        "fuel type": "fuelType",
        "fuel": "fuelType",
        "title status": "titleStatus",
        "title": "titleStatus",
        "source": "source",
        "listing url": "listingUrl",
        "url": "listingUrl",
        "vin": "vin",
        "seats": "seats",
    };

    const result: Record<string, unknown> = {};
    const lines = block.split("\n");
    let inDescription = false;
    let descLines: string[] = [];
    let inSellerNotes = false;
    let sellerLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Section headers
        if (trimmed.startsWith("## Listing Description") || trimmed.startsWith("## Description")) {
            inDescription = true;
            inSellerNotes = false;
            continue;
        }
        if (trimmed.startsWith("## Seller Communication") || trimmed.startsWith("## Seller Notes")) {
            inSellerNotes = true;
            inDescription = false;
            continue;
        }
        if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
            inDescription = false;
            inSellerNotes = false;
            // Don't continue — fall through for field parsing below
        }

        // Capture multi-line sections
        if (inDescription && trimmed && !trimmed.startsWith("```")) {
            descLines.push(trimmed);
            continue;
        }
        if (inSellerNotes && trimmed && !trimmed.startsWith("```")) {
            sellerLines.push(trimmed);
            continue;
        }

        // Parse "- Key: Value" or "Key: Value" lines
        const kvMatch = trimmed.match(/^[-*]?\s*(.+?):\s*(.+)$/);
        if (kvMatch) {
            const key = kvMatch[1].toLowerCase().trim();
            const value = kvMatch[2].trim();
            const field = fieldMap[key];
            if (field) {
                if (field === "year" || field === "mileage" || field === "seats") {
                    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
                    if (!isNaN(num)) result[field] = num;
                } else if (field === "price") {
                    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
                    if (!isNaN(num)) result[field] = num;
                } else {
                    result[field] = value;
                }
            }
        }
    }

    if (descLines.length > 0) result.description = descLines.join("\n");
    if (sellerLines.length > 0) result.sellerQuotes = sellerLines.join("\n");

    return {
        year: (result.year as number) ?? 0,
        make: (result.make as string) ?? "",
        model: (result.model as string) ?? "",
        price: (result.price as number) ?? 0,
        mileage: (result.mileage as number) ?? 0,
        trim: result.trim as string,
        vin: result.vin as string,
        location: result.location as string,
        titleStatus: result.titleStatus as string,
        seats: result.seats as number,
        exteriorColor: result.exteriorColor as string,
        interiorColor: result.interiorColor as string,
        transmission: result.transmission as string,
        fuelType: result.fuelType as string,
        source: result.source as string,
        listingUrl: result.listingUrl as string,
        description: result.description as string,
        postedDate: result.postedDate as string,
        sellerQuotes: result.sellerQuotes as string,
    };
}

// ── Template Generators ──

export function generateCSVTemplate(): string {
    const headers = [
        "Year", "Make", "Model", "Trim", "Price", "Mileage",
        "VIN", "Location", "Title Status", "Seats",
        "Exterior Color", "Interior Color", "Transmission", "Fuel Type",
        "Source", "Listing URL", "Posted Date", "Description"
    ];

    const example = [
        "2017", "Hyundai", "Santa Fe Sport", "2.4L Base", "7500", "100000",
        "5XYZUDLB3HG396382", "Dallas TX", "Clean", "5",
        "White", "Black", "Automatic", "Gasoline",
        "Facebook Marketplace", "https://facebook.com/marketplace/item/123456", "2026-02-10",
        "\"Great condition, highway miles, single owner. Recent oil change.\""
    ];

    return [headers.join(","), example.join(",")].join("\n");
}

export function generateMarkdownTemplate(): string {
    return `# Vehicle Listing Data

## Basic Information
- Posted Date: 2026-02-10
- Location: Dallas, TX
- Year: 2017
- Make: Hyundai
- Model: Santa Fe Sport
- Trim: 2.4L Base
- Price: 7500
- Mileage: 100000
- Exterior Color: White
- Interior Color: Black
- Transmission: Automatic
- Fuel Type: Gasoline
- Title Status: Clean
- Source: Facebook Marketplace
- Listing URL: https://facebook.com/marketplace/item/123456

## Vehicle Identification
- VIN: 5XYZUDLB3HG396382

## Listing Description
Great condition Santa Fe with highway miles. Single owner,
garage kept, all maintenance records available. Recent oil
change and new tires. No accidents, clean Carfax.

## Seller Communication Notes (Optional)
Seller responded within 5 minutes. Provided VIN immediately.
Very transparent about minor cosmetic issues.
`;
}

export function generateJSONTemplate(): string {
    return JSON.stringify({
        vehicles: [
            {
                year: 2017,
                make: "Hyundai",
                model: "Santa Fe Sport",
                trim: "2.4L Base",
                price: 7500,
                mileage: 100000,
                vin: "5XYZUDLB3HG396382",
                location: "Dallas, TX",
                titleStatus: "Clean",
                seats: 5,
                exteriorColor: "White",
                interiorColor: "Black",
                transmission: "Automatic",
                fuelType: "Gasoline",
                source: "Facebook Marketplace",
                listingUrl: "https://facebook.com/marketplace/item/123456",
                postedDate: "2026-02-10",
                description: "Great condition, highway miles, single owner."
            }
        ]
    }, null, 2);
}
