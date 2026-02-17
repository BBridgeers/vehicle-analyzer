import type { Vehicle } from "./types";

/**
 * Itemized initial investment required for rideshare operations.
 */

export interface InvestmentItem {
    item: string;
    cost: number;
    required: boolean;
    notes: string;
}

export interface InitialInvestment {
    items: InvestmentItem[];
    totalRequired: number;
    totalRecommended: number;
    totalAll: number;
}

export function calculateInitialInvestment(vehicle: Vehicle): InitialInvestment {
    const items: InvestmentItem[] = [
        {
            item: "🚗 Vehicle Purchase",
            cost: vehicle.price,
            required: true,
            notes: "Listing price before negotiation",
        },
        {
            item: "📋 Title, Tax & Registration",
            cost: Math.round(vehicle.price * 0.0625 + 75),
            required: true,
            notes: "TX sales tax (6.25%) + registration fees",
        },
        {
            item: "🔍 Pre-Purchase Inspection (PPI)",
            cost: 150,
            required: true,
            notes: "Independent mechanic inspection before buying",
        },
        {
            item: "📄 TNC Permit (City of Dallas)",
            cost: 50,
            required: true,
            notes: "Required for Uber/Lyft in Dallas-Fort Worth",
        },
        {
            item: "🔍 Vehicle Inspection (TNC)",
            cost: 35,
            required: true,
            notes: "Rideshare-specific safety inspection",
        },
        {
            item: "📱 Phone Mount",
            cost: 25,
            required: true,
            notes: "Dashboard/vent mount for navigation",
        },
        {
            item: "🔌 Phone Charger (USB-C + Lightning)",
            cost: 15,
            required: true,
            notes: "Dual-port charger for driver + passenger",
        },
        {
            item: "📹 Dashcam (Dual)",
            cost: 120,
            required: false,
            notes: "Front + interior cam for safety & disputes",
        },
        {
            item: "🧼 Initial Detail / Deep Clean",
            cost: 100,
            required: false,
            notes: "Full interior/exterior detail before first ride",
        },
        {
            item: "🧰 Emergency Kit",
            cost: 40,
            required: false,
            notes: "Jumper cables, flashlight, first aid, tire gauge",
        },
        {
            item: "💧 Passenger Amenities",
            cost: 30,
            required: false,
            notes: "Water bottles, phone charger cables, mints",
        },
        {
            item: "🪟 Window Tint",
            cost: 200,
            required: false,
            notes: "Legal tint for passenger comfort (optional)",
        },
    ];

    const totalRequired = items
        .filter((i) => i.required)
        .reduce((sum, i) => sum + i.cost, 0);

    const totalRecommended = items
        .filter((i) => !i.required)
        .reduce((sum, i) => sum + i.cost, 0);

    return {
        items,
        totalRequired,
        totalRecommended,
        totalAll: totalRequired + totalRecommended,
    };
}
