import type { VinDecodeResult } from "./types";

const NHTSA_API_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin";

/**
 * Decode VIN using NHTSA API (called directly from browser).
 *
 * Audit fix: Added proper VIN format validation (17 alphanumeric, no I/O/Q)
 */
export function isValidVin(vin: string): boolean {
    if (!vin || vin.length !== 17) return false;
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

export async function decodeVin(
    vin: string
): Promise<VinDecodeResult | null> {
    if (!isValidVin(vin)) return null;

    try {
        const response = await fetch(
            `${NHTSA_API_URL}/${vin.toUpperCase()}?format=json`,
            { signal: AbortSignal.timeout(10000) }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const results: Record<string, string> = {};

        for (const item of data.Results) {
            if (item.Value && item.Value.trim()) {
                results[item.Variable] = item.Value.trim();
            }
        }

        return {
            make: results.Make || "",
            model: results.Model || "",
            year: results.ModelYear || "",
            engine: results.EngineModel || "",
            displacement: results.DisplacementL || "",
            cylinders: results.EngineCylinders || "",
            fuelType: results.FuelTypePrimary || "",
            transmission: results.TransmissionStyle || "",
            driveType: results.DriveType || "",
            seats: results.Seats || "",
            bodyClass: results.BodyClass || "",
        };
    } catch {
        return null;
    }
}
