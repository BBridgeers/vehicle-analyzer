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
    _make: string
): InsuranceEstimates {
    const age = CURRENT_YEAR - year;

    // Age multiplier — older vehicles cost slightly more to insure
    const ageMult = age < 10 ? 1.0 : 1.15;

    const personalMonthly = Math.round(INSURANCE_BASE_MONTHLY * ageMult * 100) / 100;
    const rideshareMonthly = Math.round(personalMonthly * 1.15 * 100) / 100;
    const commercialMonthly = Math.round(personalMonthly * 1.9 * 100) / 100;

    // Per-carrier estimates
    const carriers: Record<string, number> = {};
    for (const [carrier, multiplier] of Object.entries(INSURANCE_CARRIERS)) {
        carriers[carrier] = Math.round(personalMonthly * multiplier * 100) / 100;
    }

    return {
        personalMonthly,
        personalAnnual: Math.round(personalMonthly * 12 * 100) / 100,
        rideshareMonthly,
        rideshareAnnual: Math.round(rideshareMonthly * 12 * 100) / 100,
        commercialMonthly,
        commercialAnnual: Math.round(commercialMonthly * 12 * 100) / 100,
        carriers,
    };
}
