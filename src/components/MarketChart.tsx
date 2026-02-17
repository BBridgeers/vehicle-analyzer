"use client";

import type { MarketValues } from "@/lib/types";

interface MarketChartProps {
    marketValues: MarketValues;
    askingPrice: number;
}

export default function MarketChart({ marketValues, askingPrice }: MarketChartProps) {
    const entries = [
        { label: "Trade-In", value: marketValues.tradeIn, color: "var(--color-text-muted)" },
        { label: "PP Low", value: marketValues.privatePartyLow, color: "var(--color-accent-cyan)" },
        { label: "Asking", value: askingPrice, color: "var(--color-accent-violet)" },
        { label: "PP Avg", value: marketValues.privatePartyAvg, color: "var(--color-accent-indigo)" },
        { label: "PP High", value: marketValues.privatePartyHigh, color: "var(--color-accent-emerald)" },
        { label: "Dealer", value: marketValues.dealerRetail, color: "var(--color-accent-amber)" },
    ];

    const maxValue = Math.max(...entries.map((e) => e.value));

    return (
        <div className="space-y-3">
            {entries.map((entry) => {
                const pct = maxValue > 0 ? (entry.value / maxValue) * 100 : 0;
                const isAsking = entry.label === "Asking";

                return (
                    <div key={entry.label} className="flex items-center gap-4">
                        <span
                            className={`text-sm w-16 text-right shrink-0 ${isAsking ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                                }`}
                        >
                            {entry.label}
                        </span>
                        <div className="flex-1 h-9 bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden relative">
                            <div
                                className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-3"
                                style={{
                                    width: `${pct}%`,
                                    backgroundColor: entry.color,
                                    opacity: isAsking ? 1 : 0.7,
                                }}
                            >
                                <span className="text-xs font-semibold text-white drop-shadow-md">
                                    ${entry.value.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--color-border-subtle)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                    PP = Private Party • Market values based on depreciation model •
                    Verify with KBB/Edmunds for trim-specific pricing
                </p>
            </div>
        </div>
    );
}
