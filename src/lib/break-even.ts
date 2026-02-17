import type { Vehicle, MarketValues } from "./types";

/**
 * Break-even analysis: How much can be spent on repairs
 * before the deal goes upside-down?
 */

export interface BreakEvenAnalysis {
    repairCushion: number;
    maxRepairBudget: number;
    isUpsideDown: boolean;
    breakEvenPrice: number;
    cushionPct: number;
    riskAssessment: string;
}

export function calculateBreakEven(
    vehicle: Vehicle,
    marketValues: MarketValues
): BreakEvenAnalysis {
    const price = vehicle.price;
    const marketAvg = marketValues.privatePartyAvg;

    const repairCushion = marketAvg - price;
    const maxRepairBudget = Math.max(0, repairCushion);
    const isUpsideDown = repairCushion < 0;
    const breakEvenPrice = marketAvg;
    const cushionPct = price > 0 ? (repairCushion / price) * 100 : 0;

    let riskAssessment: string;
    if (repairCushion > 3000) {
        riskAssessment = "Excellent cushion — can absorb major repairs and still profit.";
    } else if (repairCushion > 1500) {
        riskAssessment = "Good cushion — can handle typical maintenance costs.";
    } else if (repairCushion > 0) {
        riskAssessment = "Thin cushion — any significant repair erases the deal's value.";
    } else {
        riskAssessment = "Already upside-down — paying above market value before any repairs.";
    }

    return {
        repairCushion,
        maxRepairBudget,
        isUpsideDown,
        breakEvenPrice,
        cushionPct: Math.round(cushionPct * 10) / 10,
        riskAssessment,
    };
}
