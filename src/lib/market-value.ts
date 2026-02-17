import { BASE_VALUES, CURRENT_YEAR, DEFAULT_MSRP } from "./constants";
import type { MarketValues } from "./types";

/**
 * Calculate market values using depreciation model.
 *
 * Audit fixes applied:
 * - Clamped base_value to minimum $500 (avoids negative values for very old/high-mileage)
 * - Added input validation (year bounds, mileage non-negative)
 * - Expanded make database
 */
export function estimateMarketValue(
    year: number,
    make: string,
    model: string,
    mileage: number
): MarketValues {
    // Input validation
    const clampedYear = Math.max(1990, Math.min(CURRENT_YEAR, year));
    const clampedMileage = Math.max(0, mileage);

    // Look up base MSRP
    const normalizedMake = make.toLowerCase().replace(/[\s-]/g, "_");
    const baseMsrp = BASE_VALUES[normalizedMake] ?? DEFAULT_MSRP;

    // Age depreciation
    const age = CURRENT_YEAR - clampedYear;
    let ageFactor: number;

    if (age <= 0) {
        ageFactor = 0.95; // Current year — minimal depreciation
    } else if (age <= 1) {
        ageFactor = 0.85; // First year — 15% hit
    } else if (age <= 5) {
        ageFactor = 0.85 * Math.pow(0.9, age - 1); // 10%/year for years 2–5
    } else {
        ageFactor = 0.85 * Math.pow(0.9, 4) * Math.pow(0.95, age - 5); // 5%/year after year 5
    }

    // Mileage adjustment
    const expectedMiles = age * 12000;
    const excessMiles = Math.max(0, clampedMileage - expectedMiles);
    const mileagePenalty = (excessMiles / 1000) * 100;

    // Base value with floor
    const baseValue = Math.max(500, baseMsrp * ageFactor - mileagePenalty);

    return {
        privatePartyLow: roundToNearest(baseValue * 0.85, 100),
        privatePartyAvg: roundToNearest(baseValue * 0.92, 100),
        privatePartyHigh: roundToNearest(baseValue, 100),
        dealerRetail: roundToNearest(baseValue * 1.15, 100),
        tradeIn: roundToNearest(baseValue * 0.75, 100),
    };
}

function roundToNearest(value: number, nearest: number): number {
    return Math.round(value / nearest) * nearest;
}
