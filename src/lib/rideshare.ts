import { CURRENT_YEAR, GAS_PRICE_DFW, RIDESHARE_RATES } from "./constants";
import type {
    RideshareEligibilityResult,
    RideshareEarnings,
    EarningsScenario,
} from "./types";

/**
 * Check eligibility for rideshare platforms.
 *
 * Audit fix: Added null-safe default for seats (was crashing if seats was undefined)
 */
export function checkRideshareEligibility(
    year: number,
    seats: number = 5
): RideshareEligibilityResult {
    const age = CURRENT_YEAR - year;

    return {
        uberX: {
            eligible: age <= 15 && seats >= 4,
            reason: `Age: ${age}yr (max 15), Seats: ${seats} (min 4)`,
        },
        uberComfort: {
            eligible: age <= 7 && seats >= 4, // 2026 rule: 7 years or newer
            reason: `Age: ${age}yr (max 7), Seats: ${seats} (min 4)`,
        },
        uberXL: {
            eligible: age <= 15 && seats >= 7,
            reason: `Age: ${age}yr (max 15), Seats: ${seats} (min 7)`,
        },
        lyft: {
            eligible: age <= 13 && seats >= 4,
            reason: `Age: ${age}yr (max 13), Seats: ${seats} (min 4)`,
        },
        lyftXL: {
            eligible: age <= 13 && seats >= 7,
            reason: `Age: ${age}yr (max 13), Seats: ${seats} (min 7)`,
        },
    };
}

/**
 * Calculate rideshare earnings projections.
 *
 * Audit fix: Made weekly hours configurable instead of hardcoded 40
 */
export function calculateRideshareEarnings(
    rideClass: 'standard' | 'comfort' | 'xl' = 'standard',
    weeklyHours: number = 40
): RideshareEarnings {
    const rates = RIDESHARE_RATES[rideClass];

    const scenarios: Record<string, EarningsScenario> = {};

    for (const [scenario, rate] of Object.entries(rates)) {
        const weeklyGross = weeklyHours * rate;

        // Deductions
        const platformFee = weeklyGross * 0.25;
        const fuel = ((weeklyHours * 25) / 22) * GAS_PRICE_DFW;
        const insuranceMaint = 60;

        const weeklyNet = weeklyGross - platformFee - fuel - insuranceMaint;

        scenarios[scenario] = {
            weeklyNet: Math.round(weeklyNet * 100) / 100,
            week13: Math.round(weeklyNet * 13 * 100) / 100,
            week26: Math.round(weeklyNet * 26 * 100) / 100,
            week52: Math.round(weeklyNet * 52 * 100) / 100,
        };
    }

    return scenarios as unknown as RideshareEarnings;
}

/**
 * Calculate payback period in weeks
 */
export function calculatePaybackWeeks(
    vehiclePrice: number,
    weeklyNet: number
): number {
    if (weeklyNet <= 0) return Infinity;
    return Math.ceil(vehiclePrice / weeklyNet);
}
