"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { decodeVin, isValidVin } from "@/lib/vin-decoder";
import ImageUploader from "./ImageUploader";

interface VehicleFormProps {
    onSubmit: (vehicle: Vehicle) => void;
    isLoading: boolean;
    initialData?: Vehicle | null; // New prop
}

const CURRENT_YEAR = new Date().getFullYear();

const defaultForm: Vehicle = {
    year: undefined as any,
    make: "",
    model: "",
    trim: "",
    price: undefined as any,
    mileage: undefined as any,
    vin: "",
    location: "",
    titleStatus: "",
    seats: undefined as any,
    exteriorColor: "",
    interiorColor: "",
    transmission: "",
    fuelType: "",
    source: "",
    listingUrl: "",
    description: "",
    postedDate: "",
};

export default function VehicleForm({ onSubmit, isLoading, initialData }: VehicleFormProps) {
    // Helper for capitalization
    const toTitleCase = (str: string) => {
        return str.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const [form, setForm] = useState<Vehicle>(defaultForm);

    // Sync with external data (e.g. from URL import)
    useEffect(() => {
        if (initialData) {
            setForm((prev) => ({
                ...initialData,
                make: toTitleCase(initialData.make),
                exteriorColor: initialData.exteriorColor ? toTitleCase(initialData.exteriorColor) : "",
                interiorColor: initialData.interiorColor ? toTitleCase(initialData.interiorColor) : "",
            }));
        }
    }, [initialData]);

    const [vinStatus, setVinStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [vinInfo, setVinInfo] = useState<string>("");

    const updateField = <K extends keyof Vehicle>(key: K, value: Vehicle[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleVinDecode = async () => {
        if (!form.vin || !isValidVin(form.vin)) {
            setVinStatus("error");
            setVinInfo("VIN must be exactly 17 alphanumeric characters (no I, O, Q)");
            return;
        }

        setVinStatus("loading");
        const result = await decodeVin(form.vin);

        if (result && result.make) {
            setVinStatus("success");
            setVinInfo(`${result.year} ${result.make} ${result.model}`);
            setForm((prev) => ({
                ...prev,
                make: result.make || prev.make,
                model: result.model || prev.model,
                year: result.year ? parseInt(result.year) : prev.year,
                seats: result.seats ? parseInt(result.seats) : prev.seats,
                transmission: result.transmission || prev.transmission,
                fuelType: result.fuelType || prev.fuelType,
            }));
        } else {
            setVinStatus("error");
            setVinInfo("Could not decode VIN. Verify it is correct.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.year || !form.make || !form.model || !form.price) return;
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8" id="vehicle-form">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Vehicle Details
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Enter the listing information — only Year, Make, Model & Price are required
                    </p>
                </div>
            </div>

            {/* VIN Decode Row */}
            <div className="mb-8 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <label className="form-label" htmlFor="vin-input">VIN (Optional — Auto-fills fields)</label>
                <div className="flex gap-3">
                    <input
                        id="vin-input"
                        type="text"
                        value={form.vin || ""}
                        onChange={(e) => {
                            updateField("vin", e.target.value.toUpperCase());
                            setVinStatus("idle");
                            setVinInfo("");
                        }}
                        placeholder="e.g. 5XYKTDA60HG123456"
                        className="form-input flex-1 font-mono tracking-wider"
                        maxLength={17}
                    />
                    <button
                        type="button"
                        onClick={handleVinDecode}
                        disabled={vinStatus === "loading"}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                        id="vin-decode-btn"
                    >
                        {vinStatus === "loading" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        Decode
                    </button>
                </div>
                {vinInfo && (
                    <div className={`flex items-center gap-2 mt-2 text-sm ${vinStatus === "success"
                        ? "text-[var(--color-accent-emerald)]"
                        : "text-[var(--color-accent-rose)]"
                        }`}>
                        {vinStatus === "success" ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                            <XCircle className="w-4 h-4 shrink-0" />
                        )}
                        {vinInfo}
                    </div>
                )}
            </div>

            {/* ========== SECTION: Core Vehicle Info ========== */}
            <fieldset className="mb-8">
                <legend className="text-sm font-semibold text-[var(--color-accent-indigo)] uppercase tracking-wider mb-4">
                    Core Vehicle Info
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                        <label className="form-label" htmlFor="year-input">Year *</label>
                        <input
                            id="year-input"
                            type="number"
                            value={form.year || ""}
                            onChange={(e) => updateField("year", parseInt(e.target.value) || 0)}
                            min={1990}
                            max={CURRENT_YEAR}
                            className="form-input"
                            placeholder="e.g. 2017"
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="make-input">Make *</label>
                        <input
                            id="make-input"
                            type="text"
                            value={form.make}
                            onChange={(e) => updateField("make", toTitleCase(e.target.value))}
                            placeholder="e.g. Honda"
                            className="form-input"
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="model-input">Model *</label>
                        <input
                            id="model-input"
                            type="text"
                            value={form.model}
                            onChange={(e) => updateField("model", e.target.value)}
                            placeholder="e.g. Civic"
                            className="form-input"
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="trim-input">Trim</label>
                        <input
                            id="trim-input"
                            type="text"
                            value={form.trim || ""}
                            onChange={(e) => updateField("trim", e.target.value)}
                            placeholder="e.g. EX-L, Sport, SE"
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="price-input">Asking Price ($) *</label>
                        <input
                            id="price-input"
                            type="number"
                            value={form.price || ""}
                            onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                            min={0}
                            step={100}
                            className="form-input"
                            placeholder="e.g. 6500"
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="mileage-input">Mileage</label>
                        <input
                            id="mileage-input"
                            type="number"
                            value={form.mileage || ""}
                            onChange={(e) => updateField("mileage", parseInt(e.target.value) || 0)}
                            min={0}
                            placeholder="If known"
                            className="form-input"
                        />
                    </div>
                </div>
            </fieldset>

            {/* ========== SECTION: Vehicle Details ========== */}
            <fieldset className="mb-8">
                <legend className="text-sm font-semibold text-[var(--color-accent-indigo)] uppercase tracking-wider mb-4">
                    Vehicle Details
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                        <label className="form-label" htmlFor="seats-input">Seats</label>
                        <input
                            id="seats-input"
                            type="number"
                            value={form.seats || ""}
                            onChange={(e) => updateField("seats", parseInt(e.target.value) || 5)}
                            min={2}
                            max={9}
                            className="form-input"
                            placeholder="e.g. 5"
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="transmission-select">Transmission</label>
                        <select
                            id="transmission-select"
                            value={form.transmission || ""}
                            onChange={(e) => updateField("transmission", e.target.value)}
                            className="form-select"
                        >
                            <option value="" disabled>Select Transmission</option>
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                            <option value="CVT">CVT</option>
                            <option value="Dual-Clutch">Dual-Clutch (DCT)</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label" htmlFor="fuel-select">Fuel Type</label>
                        <select
                            id="fuel-select"
                            value={form.fuelType || ""}
                            onChange={(e) => updateField("fuelType", e.target.value)}
                            className="form-select"
                        >
                            <option value="" disabled>Select Fuel Type</option>
                            <option value="Gasoline">Gasoline</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Electric">Electric</option>
                            <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                            <option value="Flex Fuel">Flex Fuel</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label" htmlFor="ext-color-input">Exterior Color</label>
                        <input
                            id="ext-color-input"
                            type="text"
                            value={form.exteriorColor || ""}
                            onChange={(e) => updateField("exteriorColor", toTitleCase(e.target.value))}
                            placeholder="e.g. White, Silver, Black"
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="int-color-input">Interior Color</label>
                        <input
                            id="int-color-input"
                            type="text"
                            value={form.interiorColor || ""}
                            onChange={(e) => updateField("interiorColor", toTitleCase(e.target.value))}
                            placeholder="e.g. Black, Tan, Gray"
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="title-select">Title Status</label>
                        <select
                            id="title-select"
                            value={form.titleStatus || ""}
                            onChange={(e) => updateField("titleStatus", e.target.value)}
                            className="form-select"
                        >
                            <option value="" disabled>Select Title Status</option>
                            <option value="Clean">Clean</option>
                            <option value="Salvage">Salvage</option>
                            <option value="Rebuilt">Rebuilt</option>
                            <option value="Lemon">Lemon</option>
                            <option value="Unknown">Unknown</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* ========== SECTION: Listing Information ========== */}
            <fieldset className="mb-8">
                <legend className="text-sm font-semibold text-[var(--color-accent-indigo)] uppercase tracking-wider mb-4">
                    Listing Information
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                    <div>
                        <label className="form-label" htmlFor="posted-date-select">Posted Date</label>
                        <select
                            id="posted-date-select"
                            value={form.postedDate || ""}
                            onChange={(e) => updateField("postedDate", e.target.value)}
                            className="form-select"
                        >
                            <option value="" disabled>Select Date Range</option>
                            <option value="today">Today</option>
                            <option value="<3 days">Less than 3 days</option>
                            <option value="<7 days">Less than 7 days</option>
                            <option value="recent">1-2 weeks ago</option>
                            <option value="older">Older than 2 weeks</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label" htmlFor="location-input">Location (City)</label>
                        <input
                            id="location-input"
                            type="text"
                            value={form.location || ""}
                            onChange={(e) => updateField("location", e.target.value)}
                            placeholder="e.g. Dallas, TX"
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="source-select">Source</label>
                        <select
                            id="source-select"
                            value={form.source || ""}
                            onChange={(e) => updateField("source", e.target.value)}
                            className="form-select"
                        >
                            <option value="" disabled>Select Source</option>
                            <option value="Facebook Marketplace">Facebook Marketplace</option>
                            <option value="Craigslist">Craigslist</option>
                            <option value="AutoTempest">AutoTempest</option>
                            <option value="Cars.com">Cars.com</option>
                            <option value="CarGurus">CarGurus</option>
                            <option value="Autotrader">Autotrader</option>
                            <option value="OfferUp">OfferUp</option>
                            <option value="Carvana">Carvana</option>
                            <option value="Dealer Website">Dealer Website</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="mb-5">
                    <label className="form-label" htmlFor="listing-url-input">Listing URL</label>
                    <input
                        id="listing-url-input"
                        type="url"
                        value={form.listingUrl || ""}
                        onChange={(e) => {
                            const url = e.target.value;
                            updateField("listingUrl", url);

                            // Auto-detect source
                            const lowerUrl = url.toLowerCase();
                            let detectedSource = "Other";
                            if (lowerUrl.includes("dealership.com") || lowerUrl.includes("dealer.com")) detectedSource = "Dealer Website";
                            else if (lowerUrl.includes("craigslist.org")) detectedSource = "Craigslist";
                            else if (lowerUrl.includes("autotempest.com")) detectedSource = "AutoTempest";
                            else if (lowerUrl.includes("cars.com")) detectedSource = "Cars.com";
                            else if (lowerUrl.includes("cargurus.com")) detectedSource = "CarGurus";
                            else if (lowerUrl.includes("facebook.com/marketplace")) detectedSource = "Facebook Marketplace";
                            else if (lowerUrl.includes("autotrader.com")) detectedSource = "Autotrader";
                            else if (lowerUrl.includes("offerup.com")) detectedSource = "OfferUp";
                            else if (lowerUrl.includes("carvana.com")) detectedSource = "Carvana";

                            if (detectedSource) {
                                updateField("source", detectedSource);
                            }
                        }}
                        placeholder="https://..."
                        className="form-input"
                    />
                </div>

                <div>
                    <label className="form-label" htmlFor="description-textarea">Listing Description</label>
                    <textarea
                        id="description-textarea"
                        value={form.description || ""}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Paste the full listing description here..."
                        rows={4}
                        className="form-input resize-y min-h-[100px]"
                    />
                </div>
            </fieldset>

            {/* ========== SECTION: Condition Notes (Optional) ========== */}
            <fieldset className="mb-8">
                <legend className="text-sm font-semibold text-[var(--color-accent-indigo)] uppercase tracking-wider mb-4">
                    Condition Notes (Optional)
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="form-label" htmlFor="condition-exterior">Exterior</label>
                        <textarea
                            id="condition-exterior"
                            value={form.conditionExterior || ""}
                            onChange={(e) => updateField("conditionExterior", e.target.value)}
                            placeholder="Paint condition, dents, rust, scratches..."
                            rows={3}
                            className="form-input resize-y min-h-[80px]"
                        />
                    </div>
                    <div>
                        <label className="form-label" htmlFor="condition-interior">Interior</label>
                        <textarea
                            id="condition-interior"
                            value={form.conditionInterior || ""}
                            onChange={(e) => updateField("conditionInterior", e.target.value)}
                            placeholder="Seat wear, dashboard, headliner, odor..."
                            rows={3}
                            className="form-input resize-y min-h-[80px]"
                        />
                    </div>
                    <div>
                        <label className="form-label" htmlFor="condition-mechanical">Mechanical</label>
                        <textarea
                            id="condition-mechanical"
                            value={form.conditionMechanical || ""}
                            onChange={(e) => updateField("conditionMechanical", e.target.value)}
                            placeholder="Engine sounds, transmission, leaks..."
                            rows={3}
                            className="form-input resize-y min-h-[80px]"
                        />
                    </div>
                </div>
            </fieldset>

            {/* ========== SECTION: Seller Info (Optional) ========== */}
            <fieldset className="mb-8">
                <legend className="text-sm font-semibold text-[var(--color-accent-indigo)] uppercase tracking-wider mb-4">
                    Seller Verification (Optional)
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className="form-label" htmlFor="seller-responsiveness">Responsiveness</label>
                        <select
                            id="seller-responsiveness"
                            value={form.sellerResponsiveness || "not-contacted"}
                            onChange={(e) => updateField("sellerResponsiveness", e.target.value as Vehicle["sellerResponsiveness"])}
                            className="form-select"
                        >
                            <option value="not-contacted">Not Yet Contacted</option>
                            <option value="responsive">Responsive</option>
                            <option value="slow">Slow to Reply</option>
                            <option value="unresponsive">Unresponsive</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label" htmlFor="seller-transparency">Transparency</label>
                        <select
                            id="seller-transparency"
                            value={form.sellerTransparency || "not-assessed"}
                            onChange={(e) => updateField("sellerTransparency", e.target.value as Vehicle["sellerTransparency"])}
                            className="form-select"
                        >
                            <option value="not-assessed">Not Yet Assessed</option>
                            <option value="transparent">Transparent</option>
                            <option value="evasive">Evasive</option>
                            <option value="dishonest">Dishonest / Contradictory</option>
                        </select>
                    </div>
                </div>
                <div className="mb-5">
                    <label className="form-label" htmlFor="seller-redflags">Red Flags (comma or newline separated)</label>
                    <textarea
                        id="seller-redflags"
                        value={form.sellerRedFlags || ""}
                        onChange={(e) => updateField("sellerRedFlags", e.target.value)}
                        placeholder="e.g. Won't provide VIN, Pressure to buy today, Conflicting stories..."
                        rows={2}
                        className="form-input resize-y min-h-[60px]"
                    />
                </div>
                <div>
                    <label className="form-label" htmlFor="seller-quotes">Seller Quotes / Notes</label>
                    <textarea
                        id="seller-quotes"
                        value={form.sellerQuotes || ""}
                        onChange={(e) => updateField("sellerQuotes", e.target.value)}
                        placeholder="Notable things the seller said..."
                        rows={2}
                        className="form-input resize-y min-h-[60px]"
                    />
                </div>
            </fieldset>

            {/* ========== SECTION: Vehicle Photos ========== */}
            <fieldset className="mb-8">
                <legend className="text-sm font-semibold text-[var(--color-accent-indigo)] uppercase tracking-wider mb-4">
                    Vehicle Photos (Optional)
                </legend>
                <ImageUploader onImagesChange={(files: File[]) => {
                    // Store for future GPT-4V analysis
                    console.log(`${files.length} photos attached`);
                }} />
            </fieldset>

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading || !form.year || !form.make || !form.model || !form.price}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-base"
                id="analyze-btn"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                    </>
                ) : (
                    "🔍 Analyze Vehicle"
                )}
            </button>
        </form>
    );
}
