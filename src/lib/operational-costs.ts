import type { Vehicle, InsuranceEstimates } from "./types";
import { GAS_PRICE_DFW, IRS_MILEAGE_2026 } from "./constants";

/**
 * Complete operational cost breakdown with 8+ expense categories.
 * Monthly and annual projections.
 */

export interface ExpenseItem {
    category: string;
    monthly: number;
    annual: number;
    notes: string;
}

export interface OperationalCosts {
    expenses: ExpenseItem[];
    totalMonthly: number;
    totalAnnual: number;
    costPerMile: number;
    fiveYearTotal: number;
}

export function calculateOperationalCosts(
    vehicle: Vehicle,
    insurance: InsuranceEstimates,
    isRideshare: boolean = true
): OperationalCosts {
    const mileage = vehicle.mileage || 0;
    const year = vehicle.year || 2020;
    const age = 2026 - year;

    // Estimated annual miles
    const annualMiles = isRideshare ? 30000 : 12000;
    const monthlyMiles = annualMiles / 12;

    // MPG estimate (rough by age/type)
    const mpg = (vehicle.fuelType || "").toLowerCase() === "hybrid" ? 35 :
        (vehicle.fuelType || "").toLowerCase() === "electric" ? 100 :
            (vehicle.fuelType || "").toLowerCase() === "diesel" ? 30 : 24;

    // Fuel cost
    const monthlyFuel = (monthlyMiles / mpg) * GAS_PRICE_DFW;

    // Insurance (use rideshare or personal rate)
    const monthlyInsurance = isRideshare ? insurance.rideshareMonthly : insurance.personalMonthly;

    // Maintenance scales with mileage and age
    const maintenanceBase = age > 8 ? 180 : age > 5 ? 130 : 90;
    const mileageAdj = mileage > 150000 ? 1.4 : mileage > 100000 ? 1.2 : 1.0;
    const monthlyMaintenance = Math.round(maintenanceBase * mileageAdj);

    // Registration & Inspection (Texas)
    const annualRegistration = 75;
    const annualInspection = 25;

    // Tires (every 40k miles)
    const tireSetCost = 600;
    const annualTires = (annualMiles / 40000) * tireSetCost;

    // Depreciation (annual value loss)
    const annualDepreciation = vehicle.price > 0
        ? Math.round(vehicle.price * (age > 10 ? 0.05 : 0.10))
        : 0;

    // Rideshare-specific: phone plan, supplies
    const rideshareExtras = isRideshare ? 50 : 0;

    const expenses: ExpenseItem[] = [
        {
            category: "⛽ Fuel",
            monthly: Math.round(monthlyFuel),
            annual: Math.round(monthlyFuel * 12),
            notes: `${annualMiles.toLocaleString()} mi/yr at ${mpg} MPG, $${GAS_PRICE_DFW}/gal`,
        },
        {
            category: "🛡️ Insurance",
            monthly: monthlyInsurance,
            annual: Math.round(monthlyInsurance * 12),
            notes: isRideshare ? "Rideshare coverage" : "Personal coverage",
        },
        {
            category: "🔧 Maintenance",
            monthly: monthlyMaintenance,
            annual: monthlyMaintenance * 12,
            notes: `Age: ${age}yr, Mileage: ${mileage.toLocaleString()} mi`,
        },
        {
            category: "📋 Registration",
            monthly: Math.round(annualRegistration / 12),
            annual: annualRegistration,
            notes: "Texas annual registration",
        },
        {
            category: "🔍 Inspection",
            monthly: Math.round(annualInspection / 12),
            annual: annualInspection,
            notes: "Texas annual safety inspection",
        },
        {
            category: "🛞 Tires",
            monthly: Math.round(annualTires / 12),
            annual: Math.round(annualTires),
            notes: `$${tireSetCost} per set, replaced every 40k mi`,
        },
        {
            category: "📉 Depreciation",
            monthly: Math.round(annualDepreciation / 12),
            annual: annualDepreciation,
            notes: `${age > 10 ? "5" : "10"}% annual value loss`,
        },
    ];

    if (isRideshare) {
        expenses.push({
            category: "📱 Rideshare Extras",
            monthly: rideshareExtras,
            annual: rideshareExtras * 12,
            notes: "Phone plan, supplies, car washes",
        });
    }

    const totalMonthly = expenses.reduce((sum, e) => sum + e.monthly, 0);
    const totalAnnual = expenses.reduce((sum, e) => sum + e.annual, 0);
    const costPerMile = annualMiles > 0 ? totalAnnual / annualMiles : 0;

    return {
        expenses,
        totalMonthly,
        totalAnnual,
        costPerMile: Math.round(costPerMile * 100) / 100,
        fiveYearTotal: totalAnnual * 5,
    };
}
