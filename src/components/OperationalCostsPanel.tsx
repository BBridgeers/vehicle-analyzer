"use client";

import { useState } from "react";
import type { OperationalCosts } from "@/lib/operational-costs";

interface Props {
    costs: OperationalCosts;
}

export default function OperationalCostsPanel({ costs }: Props) {
    const [view, setView] = useState<"monthly" | "annual">("monthly");

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setView("monthly")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "monthly"
                            ? "bg-[var(--color-accent-indigo)] text-white"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setView("annual")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "annual"
                            ? "bg-[var(--color-accent-indigo)] text-white"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                >
                    Annual
                </button>
            </div>

            {/* Expense table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                            <th className="text-left py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Category</th>
                            <th className="text-right py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                                {view === "monthly" ? "Monthly" : "Annual"}
                            </th>
                            <th className="text-left py-2 pl-4 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {costs.expenses.map((expense) => (
                            <tr key={expense.category} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-glass)]">
                                <td className="py-2.5 text-[var(--color-text-primary)]">{expense.category}</td>
                                <td className="py-2.5 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                                    ${(view === "monthly" ? expense.monthly : expense.annual).toLocaleString()}
                                </td>
                                <td className="py-2.5 pl-4 text-xs text-[var(--color-text-muted)]">{expense.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-[var(--color-accent-indigo)]">
                            <td className="py-3 font-bold text-[var(--color-text-primary)]">TOTAL</td>
                            <td className="py-3 text-right font-mono font-bold text-lg text-[var(--color-accent-indigo)]">
                                ${(view === "monthly" ? costs.totalMonthly : costs.totalAnnual).toLocaleString()}
                            </td>
                            <td />
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Cost per mile callout */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Cost Per Mile</p>
                    <p className="text-2xl font-bold font-mono text-[var(--color-accent-amber)]">
                        ${costs.costPerMile.toFixed(2)}
                    </p>
                </div>
                <div className="border-l border-[var(--color-border-subtle)] pl-4">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">5-Year Total</p>
                    <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                        ${costs.fiveYearTotal.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
