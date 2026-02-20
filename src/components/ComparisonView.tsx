"use client";

import { useState } from "react";
import { ArrowUpDown, X, Trophy } from "lucide-react";
import type { HistoryEntry } from "@/lib/types";
import { getHistory } from "@/lib/history";

interface ComparisonViewProps {
    onClose: () => void;
    initialSelection?: string[];
}

type SortKey = "equity" | "verdictScore" | "price" | "mileage" | "payback";

export default function ComparisonView({ onClose, initialSelection }: ComparisonViewProps) {
    const [entries] = useState<HistoryEntry[]>(() => getHistory());
    const [selected, setSelected] = useState<Set<string>>(
        new Set(initialSelection || [])
    );
    const [sortBy, setSortBy] = useState<SortKey>("equity");

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (next.size < 5) {
                next.add(id);
            }
            return next;
        });
    };

    const selectedEntries = entries
        .filter((e) => selected.has(e.id))
        .sort((a, b) => {
            switch (sortBy) {
                case "equity":
                    return b.analysis.instantEquity - a.analysis.instantEquity;
                case "verdictScore":
                    return b.analysis.verdictScore - a.analysis.verdictScore;
                case "price":
                    return a.vehicle.price - b.vehicle.price;
                case "mileage":
                    return a.vehicle.mileage - b.vehicle.mileage;
                case "payback":
                    return a.analysis.paybackWeeks.baseline - b.analysis.paybackWeeks.baseline;
                default:
                    return 0;
            }
        });

    const verdictColors: Record<string, string> = {
        "🔥 STRONG BUY": "var(--color-verdict-strong)",
        "✅ RECOMMENDED": "var(--color-verdict-recommended)",
        "⚠️ PROCEED WITH CAUTION": "var(--color-verdict-caution)",
        "🚫 AVOID": "var(--color-verdict-avoid)",
    };

    if (entries.length < 2) {
        return (
            <div className="glass-card p-8 text-center mb-8">
                <p className="text-[var(--color-text-secondary)]">
                    You need at least 2 saved analyses to compare. Analyze more vehicles first!
                </p>
                <button onClick={onClose} className="btn-secondary mt-4">
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 sm:p-8 mb-8 animate-[slide-down_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Compare Vehicles
                </h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-glass-hover)] transition-colors" title="Close comparison view">
                    <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
            </div>

            {/* Selection Grid */}
            <div className="mb-6">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                    Select 2-5 vehicles to compare ({selected.size} selected):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {entries.map((entry) => (
                        <button
                            key={entry.id}
                            onClick={() => toggleSelect(entry.id)}
                            className={`p-3 rounded-lg border text-left transition-all text-sm ${selected.has(entry.id)
                                ? "border-[var(--color-accent-indigo)] bg-[var(--color-accent-indigo)]10"
                                : "border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-text-muted)]"
                                } ${!selected.has(entry.id) && selected.size >= 5 ? "opacity-40 cursor-not-allowed" : ""}`}
                            disabled={!selected.has(entry.id) && selected.size >= 5}
                        >
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                            </span>
                            <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">
                                ${entry.vehicle.price.toLocaleString()} • {entry.vehicle.mileage.toLocaleString()} mi
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Table */}
            {selectedEntries.length >= 2 && (
                <>
                    {/* Sort Controls */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <ArrowUpDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Sort by:</span>
                        {(["equity", "price", "mileage", "payback"] as SortKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSortBy(key)}
                                className={`text-xs px-3 py-1 rounded-full transition-colors ${sortBy === key
                                    ? "bg-[var(--color-accent-indigo)] text-white"
                                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass-hover)]"
                                    }`}
                            >
                                {key === "payback" ? "Payback Time" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto -mx-2 px-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border-subtle)]">
                                    <th className="text-left py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">#</th>
                                    <th className="text-left py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Vehicle</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Price (Target)</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Mileage</th>
                                    <th className="text-center py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Risk Signals</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Ins. (Liab)</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Est. Annual Cost</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Max Wkly Rev</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Payback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEntries.map((entry, idx) => {
                                    const eq = entry.analysis.instantEquity;
                                    const isTop = idx === 0;

                                    // Price Logic: Target should never be higher than asking
                                    const rawTarget = entry.analysis.negotiation?.targetPrice || entry.analysis.marketValues.privatePartyAvg;
                                    const targetPrice = Math.min(rawTarget, entry.vehicle.price);

                                    // Insurance: Force liability estimate
                                    const rawIns = entry.analysis.insurance.personalMonthly;
                                    const insuranceCost = entry.analysis.insurance.coverageType === "Liability Only"
                                        ? rawIns
                                        : rawIns * 0.6; // Estimate liability as 60% of full coverage

                                    // Annual Cost & Depreciation
                                    const annualCost = entry.analysis.operationalCosts?.totalAnnual || 0;
                                    const depreciation = entry.analysis.operationalCosts?.expenses.find(e => e.category.includes("Depreciation"))?.annual || 0;

                                    // Earnings Logic
                                    const maxRev = entry.analysis.rideshare.earnings.optimistic.weeklyNet;
                                    const isXL = entry.analysis.rideshare.eligibility.uberXL.eligible;

                                    // Risk Logic
                                    const criticalCount = entry.analysis.criticalIssues.filter(i => i.severity === "critical").length;
                                    const highCount = entry.analysis.criticalIssues.filter(i => i.severity === "high").length;

                                    return (
                                        <tr
                                            key={entry.id}
                                            className={`border-b border-[var(--color-border-subtle)] ${isTop ? "bg-[var(--color-accent-indigo)]08" : ""
                                                }`}
                                        >
                                            <td className="py-3 px-2 align-top">
                                                {isTop ? (
                                                    <Trophy className="w-4 h-4 text-[var(--color-accent-amber)]" />
                                                ) : (
                                                    <span className="text-[var(--color-text-muted)]">{idx + 1}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-[var(--color-text-primary)] align-top">
                                                <div className="font-medium">
                                                    {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                                                </div>
                                                <div
                                                    className="text-xs mt-1 font-medium"
                                                    style={{ color: verdictColors[entry.analysis.verdict] || "var(--color-text-secondary)" }}
                                                >
                                                    {entry.analysis.verdict}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right align-top">
                                                <div className="text-[var(--color-text-secondary)]">
                                                    ${entry.vehicle.price.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-[var(--color-accent-emerald)] mt-0.5" title="Recommended negotiation target">
                                                    Target: ${targetPrice.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)] align-top">
                                                {entry.vehicle.mileage.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-center align-top">
                                                {criticalCount > 0 || highCount > 0 ? (
                                                    <div className="flex justify-center gap-1">
                                                        {criticalCount > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-rose)]20 text-[var(--color-accent-rose)] text-[10px] font-bold border border-[var(--color-accent-rose)]40">
                                                                {criticalCount} CRT
                                                            </span>
                                                        )}
                                                        {highCount > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded bg-[var(--color-accent-amber)]20 text-[var(--color-accent-amber)] text-[10px] font-medium border border-[var(--color-accent-amber)]40">
                                                                {highCount} HI
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--color-text-muted)] text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)] align-top">
                                                ${Math.round(insuranceCost)}/mo
                                            </td>
                                            <td
                                                className="py-3 px-2 text-right font-semibold align-top"
                                                style={{
                                                    color: eq >= 0 ? "var(--color-accent-emerald)" : "var(--color-accent-rose)",
                                                }}
                                            >
                                                {eq >= 0 ? "+" : ""}${eq.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-muted)] align-top" title={`Includes ~$${depreciation.toLocaleString()} annual depreciation`}>
                                                ${annualCost.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-muted)] align-top">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="font-medium text-[var(--color-accent-emerald)]">
                                                        ${Math.round(maxRev)}
                                                    </span>
                                                    {isXL && (
                                                        <span className="text-[10px] px-1 rounded bg-[var(--color-accent-purple)]10 text-[var(--color-accent-purple)] border border-[var(--color-accent-purple)]20">
                                                            XL
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)] align-top">
                                                {entry.analysis.paybackWeeks.baseline}w
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {selectedEntries.length < 2 && selected.size > 0 && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                    Select at least 1 more vehicle to see comparison.
                </p>
            )}
        </div>
    );
}
