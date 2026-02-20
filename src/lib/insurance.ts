import {
    CURRENT_YEAR,
    INSURANCE_BASE_MONTHLY,
    INSURANCE_CARRIERS,
} from "./constants";
import type { InsuranceEstimates } from "./types";

/**
 * Estimate insurance costs across policy types and carriers.
 *
 * Audit fix: Original only returned one set of numbers. Now includes
 * per-carrier personal estimates for comparison shopping.
 */
export function estimateInsurance(
    year: number,
    _make: string,
    vehicleValue: number // New param
): InsuranceEstimates {
    const age = CURRENT_YEAR - year;

    // Base Full Coverage Estimate
    const ageMult = age < 10 ? 1.0 : 1.15;
    let baseMonthly = Math.round(INSURANCE_BASE_MONTHLY * ageMult * 100) / 100;

    let coverageType: "Liability Only" | "Full Coverage" = "Full Coverage";
    let endorsementCost = 0;

    // Smart Logic: If car is cheap, assume Liability Only
    if (vehicleValue <= 7000) {
        coverageType = "Liability Only";
        // Liability is roughly 60% of Full Coverage
        baseMonthly = Math.round(baseMonthly * 0.6);
        // Rideshare Endorsement is typically a flat fee add-on
        endorsementCost = 25;
    } else {
        // Full Coverage Rideshare usually adds ~15-20%
        endorsementCost = Math.round(baseMonthly * 0.20);
    }

    const personalMonthly = baseMonthly;
    const rideshareMonthly = personalMonthly + endorsementCost;
    const commercialMonthly = Math.round(personalMonthly * 1.9 * 100) / 100;

    // Per-carrier estimates
    const carriers: Record<string, number> = {};
    for (const [carrier, multiplier] of Object.entries(INSURANCE_CARRIERS)) {
        carriers[carrier] = Math.round(personalMonthly * multiplier * 100) / 100;
    }

    return {
        coverageType,
        endorsementCost,
        personalMonthly,
        personalAnnual: Math.round(personalMonthly * 12 * 100) / 100,
        rideshareMonthly,
        rideshareAnnual: Math.round(rideshareMonthly * 12 * 100) / 100,
        commercialMonthly,
        commercialAnnual: Math.round(commercialMonthly * 12 * 100) / 100,
        carriers,
    };
}
