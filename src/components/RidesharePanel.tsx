"use client";

import { Check, X } from "lucide-react";
import type { RideshareEligibilityResult, RideshareEarnings } from "@/lib/types";
import { calculatePaybackWeeks } from "@/lib/rideshare";

interface RidesharePanelProps {
    eligibility: RideshareEligibilityResult;
    earnings: RideshareEarnings;
    vehiclePrice: number;
}

export default function RidesharePanel({
    eligibility,
    earnings,
    vehiclePrice,
}: RidesharePanelProps) {
    const platforms = [
        { name: "Uber X", data: eligibility.uberX },
        { name: "Uber XL", data: eligibility.uberXL },
        { name: "Lyft", data: eligibility.lyft },
        { name: "Lyft XL", data: eligibility.lyftXL },
    ];

    const scenarios = [
        { name: "Conservative", data: earnings.conservative, color: "var(--color-accent-cyan)" },
        { name: "Baseline", data: earnings.baseline, color: "var(--color-accent-indigo)" },
        { name: "Optimistic", data: earnings.optimistic, color: "var(--color-accent-emerald)" },
    ];

    return (
        <div className="space-y-6">
            {/* Eligibility Grid */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                    Platform Eligibility
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {platforms.map((platform) => (
                        <div
                            key={platform.name}
                            className={`p-3 rounded-lg border text-center transition-all ${platform.data.eligible
                                    ? "border-[var(--color-accent-emerald)]/30 bg-[var(--color-accent-emerald)]/5"
                                    : "border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]"
                                }`}
                        >
                            <div className="flex items-center justify-center mb-1">
                                {platform.data.eligible ? (
                                    <Check className="w-5 h-5 text-[var(--color-accent-emerald)]" />
                                ) : (
                                    <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                                )}
                            </div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {platform.name}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {platform.data.reason}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Earnings Projections */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                    Earnings Projections (40 hrs/week)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {scenarios.map((scenario) => {
                        const paybackWeeks = calculatePaybackWeeks(
                            vehiclePrice,
                            scenario.data.weeklyNet
                        );

                        return (
                            <div
                                key={scenario.name}
                                className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: scenario.color }}
                                    />
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                        {scenario.name}
                                    </span>
                                </div>

                                <p
                                    className="text-2xl font-bold mb-1"
                                    style={{ color: scenario.color }}
                                >
                                    ${scenario.data.weeklyNet.toFixed(0)}
                                    <span className="text-sm font-normal text-[var(--color-text-muted)]">
                                        /wk
                                    </span>
                                </p>

                                <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                                    <div className="flex justify-between">
                                        <span>Quarterly</span>
                                        <span className="font-mono">${scenario.data.week13.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Semi-Annual</span>
                                        <span className="font-mono">${scenario.data.week26.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Annual</span>
                                        <span className="font-mono font-semibold">${scenario.data.week52.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-[var(--color-border-subtle)]">
                                        <span>Payback</span>
                                        <span className="font-mono">
                                            {paybackWeeks === Infinity ? "N/A" : `${paybackWeeks} weeks`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
