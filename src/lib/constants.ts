// =====================================================
// CONFIGURATION CONSTANTS
// =====================================================

export const HOME_BASE = {
    city: "Southlake",
    state: "TX",
    zip: "76092",
} as const;

export const IRS_MILEAGE_2026 = 0.725;
export const GAS_PRICE_DFW = 2.89;
export const CURRENT_YEAR = 2026;

// Base MSRP by make (2020 baseline)
export const BASE_VALUES: Record<string, number> = {
    honda: 25000,
    toyota: 27000,
    hyundai: 22000,
    kia: 21000,
    ford: 28000,
    chevrolet: 27000,
    nissan: 23000,
    mazda: 24000,
    subaru: 26000,
    bmw: 45000,
    mercedes: 48000,
    audi: 42000,
    lexus: 40000,
    acura: 35000,
    volkswagen: 28000,
    jeep: 32000,
    dodge: 30000,
    ram: 35000,
    gmc: 38000,
    buick: 32000,
    cadillac: 45000,
    lincoln: 42000,
    infiniti: 38000,
    genesis: 40000,
    volvo: 40000,
    tesla: 45000,
    porsche: 65000,
    jaguar: 50000,
    land_rover: 55000,
    mini: 30000,
    fiat: 22000,
    alfa_romeo: 38000,
    chrysler: 30000,
    mitsubishi: 22000,
};

export const DEFAULT_MSRP = 25000;

// Rideshare hourly rates (DFW market)
export const RIDESHARE_RATES = {
    standard: {
        conservative: 22,
        baseline: 28,
        optimistic: 34,
    },
    xl: {
        conservative: 30,
        baseline: 38,
        optimistic: 46,
    },
} as const;

// Insurance base monthly rate
export const INSURANCE_BASE_MONTHLY = 120;

// Carrier-specific multipliers
export const INSURANCE_CARRIERS: Record<string, number> = {
    "State Farm": 1.0,
    GEICO: 0.92,
    Progressive: 0.95,
    Allstate: 1.08,
    USAA: 0.85,
    "Liberty Mutual": 1.05,
};
