"use client";

import type { BreakEvenAnalysis } from "@/lib/break-even";

interface Props {
    breakEven: BreakEvenAnalysis;
}

export default function BreakEvenPanel({ breakEven }: Props) {
    const cushionPct = Math.min(100, Math.max(0, (breakEven.repairCushion / (breakEven.breakEvenPrice || 1)) * 100));

    return (
        <div className="space-y-5">
            {/* Repair cushion bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Repair Cushion</span>
                    <span
                        className="text-lg font-bold font-mono"
                        style={{
                            color: breakEven.repairCushion > 0
                                ? "var(--color-accent-emerald)"
                                : "var(--color-accent-rose)",
                        }}
                    >
                        {breakEven.repairCushion > 0 ? "+" : ""}${breakEven.repairCushion.toLocaleString()}
                    </span>
                </div>
                <div className="w-full h-4 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${Math.max(2, cushionPct)}%`,
                            background: breakEven.repairCushion > 1500
                                ? "var(--color-accent-emerald)"
                                : breakEven.repairCushion > 0
                                    ? "var(--color-accent-amber)"
                                    : "var(--color-accent-rose)",
                        }}
                    />
                </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Max Repair Budget</p>
                    <p className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                        ${breakEven.maxRepairBudget.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Before going upside-down</p>
                </div>

                <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Break-Even Price</p>
                    <p className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                        ${breakEven.breakEvenPrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Market average (ceiling)</p>
                </div>

                <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Cushion %</p>
                    <p className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                        {breakEven.cushionPct}%
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Of asking price</p>
                </div>
            </div>

            {/* Assessment */}
            <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Risk Assessment</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{breakEven.riskAssessment}</p>
            </div>
        </div>
    );
}
