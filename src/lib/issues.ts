import { CURRENT_YEAR } from "./constants";
import type { CriticalIssue, MarketValues, Vehicle } from "./types";

/**
 * Detect red flags in a vehicle listing.
 *
 * Audit fixes:
 * - Original had a bug: `risk_score = len([i for i in issues if 'malicious' in i])`
 *   always counted ALL issues because every issue dict has a 'malicious' key.
 *   Now using severity levels for proper risk scoring.
 * - Added high-mileage and very-old-vehicle checks
 * - Added price-above-market warning
 */
export function detectIssues(
    vehicle: Vehicle,
    market: MarketValues
): CriticalIssue[] {
    const issues: CriticalIssue[] = [];
    const price = vehicle.price || 0;
    const marketAvg = market.privatePartyAvg || 0;
    const mileage = vehicle.mileage || 0;
    const year = vehicle.year || CURRENT_YEAR;
    const age = CURRENT_YEAR - year;
    const expectedMiles = age * 12000;

    // Price below market
    if (price > 0 && marketAvg > 0) {
        const diffPct = ((marketAvg - price) / marketAvg) * 100;

        if (diffPct > 30) {
            issues.push({
                title: `Price ${Math.round(diffPct)}% Below Market`,
                concern: `$${price.toLocaleString()} vs $${marketAvg.toLocaleString()} market average — extremely suspicious`,
                benign: "Estate sale, divorce settlement, urgent relocation",
                malicious:
                    "Scam listing, hidden structural damage, salvage title fraud",
                action:
                    "MUST verify title in person. Run Carfax + AutoCheck. Do NOT send deposits sight-unseen.",
                severity: "critical",
            });
        } else if (diffPct > 20) {
            issues.push({
                title: `Price ${Math.round(diffPct)}% Below Market`,
                concern: `$${price.toLocaleString()} vs $${marketAvg.toLocaleString()} market average`,
                benign: "Motivated seller, inherited vehicle, urgent sale",
                malicious: "Hidden damage, salvage title, mechanical issues",
                action: "Run Carfax + AutoCheck. Ask seller why price is low.",
                severity: "high",
            });
        }

        // Price ABOVE market
        if (diffPct < -15) {
            issues.push({
                title: `Price ${Math.round(Math.abs(diffPct))}% Above Market`,
                concern: `$${price.toLocaleString()} vs $${marketAvg.toLocaleString()} market average`,
                benign: "Rare trim, low mileage, extensive upgrades, pristine condition",
                malicious: "Dealer markup, overpriced private sale",
                action:
                    "Use market data to negotiate. Compare similar listings in your area.",
                severity: "medium",
            });
        }
    }

    // Unusually low mileage
    if (mileage > 0 && mileage < expectedMiles * 0.4) {
        issues.push({
            title: "Unusually Low Mileage",
            concern: `${mileage.toLocaleString()} mi on a ${age}-year-old vehicle (expect ~${expectedMiles.toLocaleString()})`,
            benign: "Garage kept, second car, short commute, elderly owner",
            malicious: "Odometer rollback, long-term storage (seal/gasket degradation)",
            action:
                "Verify service records. Check for dry rot on tires, fluid degradation, rodent damage.",
            severity: "medium",
        });
    }

    // Very high mileage
    if (mileage > 150000) {
        issues.push({
            title: "High Mileage Vehicle",
            concern: `${mileage.toLocaleString()} miles — major components may need replacement soon`,
            benign: "Highway miles are gentler; well-maintained vehicles can go 250k+",
            malicious: "Transmission, engine, or suspension failure imminent",
            action:
                "Budget $2,000–$5,000 for potential repairs. Get PPI with transmission check.",
            severity: mileage > 200000 ? "high" : "medium",
        });
    }

    // Non-clean title
    const titleStatus = (vehicle.titleStatus || "").toLowerCase();
    if (titleStatus && titleStatus !== "clean" && titleStatus !== "unknown") {
        issues.push({
            title: "Non-Clean Title",
            concern: `Title status: ${vehicle.titleStatus}`,
            benign: "Minor cosmetic damage repaired professionally",
            malicious: "Frame damage, flood damage, total loss history",
            action:
                "Inspect frame thoroughly. Get independent PPI. Consider walking away.",
            severity: "critical",
        });
    }

    // Old vehicle
    if (age > 12) {
        issues.push({
            title: "Aging Vehicle",
            concern: `${age} years old — nearing end of typical reliable lifespan`,
            benign:
                "Well-maintained vehicles can last 20+ years with proper care",
            malicious: "Rust, electrical issues, discontinued parts making repairs expensive",
            action:
                "Check for rust underneath. Verify parts availability for your make/model.",
            severity: "low",
        });
    }

    // Missing VIN
    if (!vehicle.vin) {
        issues.push({
            title: "No VIN Provided",
            concern: "No VIN listed. Cannot verify history yet.",
            benign: "Seller omitted VIN to reduce spam or due to platform limitations.",
            malicious: "Hiding accident history or salvage title.",
            action: "Message seller to request the VIN before finalizing an inspection.",
            severity: "low",
        });
    }

    // Always add the verification reminder
    issues.push({
        title: "VIN History Unverified",
        concern: "No Carfax/AutoCheck run yet",
        benign: "Clean history likely for well-priced, clean-title vehicles",
        malicious: "Hidden accidents, liens, odometer discrepancies",
        action:
            "Run BOTH Carfax AND AutoCheck before visiting — they use different databases.",
        severity: "medium",
    });

    return issues;
}
