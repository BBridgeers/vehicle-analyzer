import type { Vehicle, MarketValues, CriticalIssue } from "./types";

/**
 * Negotiation strategy with target prices, leverage points, and tactics.
 */

export interface NegotiationStrategy {
    targetPrice: number;
    openingOffer: number;
    walkAwayPrice: number;
    leveragePoints: string[];
    doNotList: string[];
    savingsIfSuccessful: number;
    priceAnalysis: string;
}

export function generateNegotiationStrategy(
    vehicle: Vehicle,
    marketValues: MarketValues,
    issues: CriticalIssue[]
): NegotiationStrategy {
    const price = vehicle.price;
    const marketAvg = marketValues.privatePartyAvg;
    const tradeIn = marketValues.tradeIn;

    // Target price: midpoint between trade-in and private party avg
    const targetPrice = Math.round((tradeIn + marketAvg) / 2 / 100) * 100;

    // Opening offer: 15-20% below asking (or trade-in value, whichever is lower)
    const openingOffer = Math.round(Math.min(price * 0.82, tradeIn) / 100) * 100;

    // Walk-away price: private party average (never pay above market)
    const walkAwayPrice = marketAvg;

    // Build leverage points from detected issues
    const leveragePoints: string[] = [];

    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const highCount = issues.filter((i) => i.severity === "high").length;

    if (criticalCount > 0) {
        leveragePoints.push(`${criticalCount} critical issue(s) detected — significant risk factors.`);
    }
    if (highCount > 0) {
        leveragePoints.push(`${highCount} high-severity concern(s) found in analysis.`);
    }

    if (price > marketAvg) {
        const overPct = Math.round(((price - marketAvg) / marketAvg) * 100);
        leveragePoints.push(`Price is ${overPct}% above market average ($${marketAvg.toLocaleString()}).`);
    }

    const mileage = vehicle.mileage || 0;
    if (mileage > 100000) {
        leveragePoints.push(`${mileage.toLocaleString()} miles — higher maintenance costs ahead.`);
    }

    const age = 2026 - vehicle.year;
    if (age > 8) {
        leveragePoints.push(`${age} years old — aging vehicle with potential parts availability issues.`);
    }

    if (!vehicle.vin) {
        leveragePoints.push("No VIN provided — cannot verify history until seller provides it.");
    }

    if (leveragePoints.length === 0) {
        leveragePoints.push("Listing appears fairly priced — focus on condition-based negotiation after PPI.");
    }

    // Do-Not list (common traps)
    const doNotList = [
        "Do NOT send deposits before seeing the vehicle in person.",
        "Do NOT accept 'as-is' without a PPI — always inspect.",
        "Do NOT let urgency pressure you ('someone else is coming today').",
        "Do NOT pay above your walk-away price, regardless of emotions.",
        "Do NOT negotiate from the asking price — start from market value.",
        "Do NOT share your maximum budget with the seller.",
    ];

    // Price analysis narrative
    let priceAnalysis: string;
    if (price < tradeIn) {
        priceAnalysis = `Asking price ($${price.toLocaleString()}) is BELOW trade-in value ($${tradeIn.toLocaleString()}) — suspiciously cheap. Proceed with extra caution.`;
    } else if (price < marketAvg) {
        priceAnalysis = `Asking price ($${price.toLocaleString()}) is below market ($${marketAvg.toLocaleString()}) — good starting position. Target further discount.`;
    } else {
        priceAnalysis = `Asking price ($${price.toLocaleString()}) is at or above market ($${marketAvg.toLocaleString()}) — strong negotiation leverage available.`;
    }

    return {
        targetPrice,
        openingOffer,
        walkAwayPrice,
        leveragePoints,
        doNotList,
        savingsIfSuccessful: price - targetPrice,
        priceAnalysis,
    };
}
