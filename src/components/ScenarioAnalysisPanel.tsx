"use client";

import type { ScenarioAnalysis } from "@/lib/scenarios";

interface Props {
    scenarios: ScenarioAnalysis;
    askingPrice: number;
}

export default function ScenarioAnalysisPanel({ scenarios, askingPrice }: Props) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
                What happens to your investment under 4 different outcomes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {scenarios.scenarios.map((s) => {
                    const isPositive = s.equityAfterRepairs > 0;
                    return (
                        <div
                            key={s.label}
                            className="rounded-xl p-4 border transition-all hover:scale-[1.02]"
                            style={{
                                backgroundColor: "var(--color-bg-secondary)",
                                borderColor: isPositive
                                    ? "var(--color-accent-emerald)"
                                    : "var(--color-accent-rose)",
                                borderWidth: "1px",
                            }}
                        >
                            <p className="text-sm font-semibold mb-2">{s.label}</p>
                            <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                                <div className="flex justify-between">
                                    <span>Vehicle</span>
                                    <span className="font-mono">${askingPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Repairs</span>
                                    <span className="font-mono text-[var(--color-accent-amber)]">
                                        +${s.repairCost.toLocaleString()}
                                    </span>
                                </div>
                                <div className="border-t border-[var(--color-border-subtle)] my-1" />
                                <div className="flex justify-between font-semibold">
                                    <span>Total Cost</span>
                                    <span className="font-mono">${s.totalCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm mt-2">
                                    <span>Equity</span>
                                    <span
                                        className="font-mono"
                                        style={{
                                            color: isPositive
                                                ? "var(--color-accent-emerald)"
                                                : "var(--color-accent-rose)",
                                        }}
                                    >
                                        {isPositive ? "+" : ""}${s.equityAfterRepairs.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-3 leading-tight">
                                {s.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
