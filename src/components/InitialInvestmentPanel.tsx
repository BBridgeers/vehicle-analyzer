"use client";

import type { InitialInvestment } from "@/lib/initial-investment";

interface Props {
    investment: InitialInvestment;
}

export default function InitialInvestmentPanel({ investment }: Props) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
                Everything you need to budget for before your first rideshare trip:
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                            <th className="text-left py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Item</th>
                            <th className="text-right py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Cost</th>
                            <th className="text-center py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Required?</th>
                            <th className="text-left py-2 pl-4 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {investment.items.map((item) => (
                            <tr key={item.item} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-glass)]">
                                <td className="py-2.5 text-[var(--color-text-primary)]">{item.item}</td>
                                <td className="py-2.5 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                                    ${item.cost.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-center">
                                    {item.required ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent-rose)] bg-opacity-20 text-[var(--color-accent-rose)]"
                                            style={{ backgroundColor: "rgba(244,63,94,0.15)" }}>
                                            Required
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-[var(--color-text-muted)]"
                                            style={{ backgroundColor: "rgba(100,116,139,0.15)" }}>
                                            Optional
                                        </span>
                                    )}
                                </td>
                                <td className="py-2.5 pl-4 text-xs text-[var(--color-text-muted)]">{item.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl p-4 border border-[var(--color-accent-rose)] bg-[var(--color-bg-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Required Total</p>
                    <p className="text-xl font-bold font-mono text-[var(--color-accent-rose)]">
                        ${investment.totalRequired.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl p-4 border border-[var(--color-accent-amber)] bg-[var(--color-bg-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Recommended Add</p>
                    <p className="text-xl font-bold font-mono text-[var(--color-accent-amber)]">
                        +${investment.totalRecommended.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl p-4 border border-[var(--color-accent-indigo)] bg-[var(--color-bg-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">All-In Total</p>
                    <p className="text-xl font-bold font-mono text-[var(--color-accent-indigo)]">
                        ${investment.totalAll.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
