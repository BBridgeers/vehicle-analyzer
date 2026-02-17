"use client";

import { useState } from "react";
import { ArrowUpDown, X, Trophy } from "lucide-react";
import type { HistoryEntry } from "@/lib/types";
import { getHistory } from "@/lib/history";

interface ComparisonViewProps {
    onClose: () => void;
}

type SortKey = "equity" | "verdictScore" | "price" | "mileage" | "payback";

export default function ComparisonView({ onClose }: ComparisonViewProps) {
    const [entries] = useState<HistoryEntry[]>(() => getHistory());
    const [selected, setSelected] = useState<Set<string>>(new Set());
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
                        {(["equity", "verdictScore", "price", "mileage", "payback"] as SortKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSortBy(key)}
                                className={`text-xs px-3 py-1 rounded-full transition-colors ${sortBy === key
                                    ? "bg-[var(--color-accent-indigo)] text-white"
                                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass-hover)]"
                                    }`}
                            >
                                {key === "verdictScore" ? "Score" : key === "payback" ? "Payback" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto -mx-2 px-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border-subtle)]">
                                    <th className="text-left py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">#</th>
                                    <th className="text-left py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Vehicle</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Price</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Mileage</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Equity</th>
                                    <th className="text-center py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Verdict</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Score</th>
                                    <th className="text-right py-3 px-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Payback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEntries.map((entry, idx) => {
                                    const eq = entry.analysis.instantEquity;
                                    const isTop = idx === 0;
                                    return (
                                        <tr
                                            key={entry.id}
                                            className={`border-b border-[var(--color-border-subtle)] ${isTop ? "bg-[var(--color-accent-indigo)]08" : ""
                                                }`}
                                        >
                                            <td className="py-3 px-2">
                                                {isTop ? (
                                                    <Trophy className="w-4 h-4 text-[var(--color-accent-amber)]" />
                                                ) : (
                                                    <span className="text-[var(--color-text-muted)]">{idx + 1}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 font-medium text-[var(--color-text-primary)]">
                                                {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)]">
                                                ${entry.vehicle.price.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)]">
                                                {entry.vehicle.mileage.toLocaleString()}
                                            </td>
                                            <td
                                                className="py-3 px-2 text-right font-semibold"
                                                style={{
                                                    color: eq >= 0 ? "var(--color-accent-emerald)" : "var(--color-accent-rose)",
                                                }}
                                            >
                                                {eq >= 0 ? "+" : ""}${eq.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: verdictColors[entry.analysis.verdict] || "var(--color-text-secondary)" }}
                                                >
                                                    {entry.analysis.verdict}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)]">
                                                {entry.analysis.verdictScore}/100
                                            </td>
                                            <td className="py-3 px-2 text-right text-[var(--color-text-secondary)]">
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
