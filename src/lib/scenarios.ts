import type { Vehicle, MarketValues } from "./types";

/**
 * 4 purchase outcome scenarios:
 * Best Case, Typical Case, Worst Case, Disaster Case
 */

export interface FinancialScenario {
    label: string;
    repairCost: number;
    totalCost: number;
    effectivePrice: number;
    equityAfterRepairs: number;
    description: string;
}

export interface ScenarioAnalysis {
    scenarios: FinancialScenario[];
    bestEquity: number;
    worstEquity: number;
}

export function calculateScenarios(
    vehicle: Vehicle,
    marketValues: MarketValues
): ScenarioAnalysis {
    const price = vehicle.price;
    const marketAvg = marketValues.privatePartyAvg;
    const mileage = vehicle.mileage || 0;

    // Scale repair estimates by mileage
    const mileageFactor = mileage > 150000 ? 1.5 : mileage > 100000 ? 1.2 : 1.0;

    const scenarios: FinancialScenario[] = [
        {
            label: "🟢 Best Case",
            repairCost: 0,
            totalCost: price,
            effectivePrice: price,
            equityAfterRepairs: marketAvg - price,
            description: "Clean history, no repairs needed. Drive away ready.",
        },
        {
            label: "🟡 Typical Case",
            repairCost: Math.round(750 * mileageFactor),
            totalCost: price + Math.round(750 * mileageFactor),
            effectivePrice: price + Math.round(750 * mileageFactor),
            equityAfterRepairs: marketAvg - (price + Math.round(750 * mileageFactor)),
            description: "Minor maintenance: brakes, tires, fluid flush, filters.",
        },
        {
            label: "🟠 Worst Case",
            repairCost: Math.round(2500 * mileageFactor),
            totalCost: price + Math.round(2500 * mileageFactor),
            effectivePrice: price + Math.round(2500 * mileageFactor),
            equityAfterRepairs: marketAvg - (price + Math.round(2500 * mileageFactor)),
            description: "Major repair needed: suspension, AC compressor, catalytic converter.",
        },
        {
            label: "🔴 Disaster Case",
            repairCost: Math.round(5000 * mileageFactor),
            totalCost: price + Math.round(5000 * mileageFactor),
            effectivePrice: price + Math.round(5000 * mileageFactor),
            equityAfterRepairs: marketAvg - (price + Math.round(5000 * mileageFactor)),
            description: "Engine or transmission failure. Rebuild or replace required.",
        },
    ];

    return {
        scenarios,
        bestEquity: scenarios[0].equityAfterRepairs,
        worstEquity: scenarios[3].equityAfterRepairs,
    };
}
