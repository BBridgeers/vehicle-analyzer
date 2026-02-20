"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Clock, ArrowRight, Download, CheckSquare, Square, BarChart3 } from "lucide-react";
import type { Vehicle, AnalysisResult, HistoryEntry } from "@/lib/types";
import { getHistory, deleteFromHistory, clearHistory } from "@/lib/history";

interface HistoryPanelProps {
    onClose: () => void;
    onLoad: (vehicle: Vehicle, analysis: AnalysisResult) => void;
    onCompare: (ids: string[]) => void;
}

export default function HistoryPanel({ onClose, onLoad, onCompare }: HistoryPanelProps) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        setEntries(getHistory());
    }, []);

    const handleDelete = (id: string) => {
        deleteFromHistory(id);
        setEntries(getHistory());
        if (selected.has(id)) {
            const next = new Set(selected);
            next.delete(id);
            setSelected(next);
        }
    };

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

    const handleClear = () => {
        if (confirm("Clear all history? This cannot be undone.")) {
            clearHistory();
            setEntries([]);
        }
    };

    const handleExportCSV = () => {
        if (entries.length === 0) return;

        const headers = [
            "Date", "Year", "Make", "Model", "Price", "Mileage",
            "Market Value (Private)", "Market Value (Dealer)", "Instant Equity",
            "Verdict", "Score", "Issues Count",
            "Payback Weeks (Baseline)", "Insurance (Monthly)"
        ];

        const rows = entries.map((e) => [
            new Date(e.timestamp).toLocaleDateString(),
            e.vehicle.year, e.vehicle.make, e.vehicle.model,
            e.vehicle.price, e.vehicle.mileage,
            e.analysis.marketValues.privatePartyAvg,
            e.analysis.marketValues.dealerRetail,
            e.analysis.instantEquity,
            `"${e.analysis.verdict.replace(/"/g, '""')}"`,
            e.analysis.verdictScore,
            e.analysis.criticalIssues.length,
            e.analysis.paybackWeeks.baseline,
            e.analysis.insurance.personalMonthly,
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vehicle-analysis-export-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const verdictColors: Record<string, string> = {
        "🔥 STRONG BUY": "var(--color-verdict-strong)",
        "✅ RECOMMENDED": "var(--color-verdict-recommended)",
        "⚠️ PROCEED WITH CAUTION": "var(--color-verdict-caution)",
        "🚫 AVOID": "var(--color-verdict-avoid)",
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end" id="history-panel">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-[var(--color-bg-primary)] border-l border-[var(--color-border-subtle)] overflow-y-auto animate-[slide-down_0.3s_ease-out]">
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]" style={{ background: "rgba(10, 10, 15, 0.95)", backdropFilter: "blur(16px)" }}>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[var(--color-accent-indigo)]" />
                        <h2 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Analysis History
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-glass)] text-[var(--color-text-muted)]">
                            {entries.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {selected.size >= 2 && (
                            <button
                                onClick={() => onCompare(Array.from(selected))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent-indigo)] text-white text-xs font-medium hover:bg-indigo-600 transition-colors animate-[fade-in_0.2s_ease-out]"
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                Compare ({selected.size})
                            </button>
                        )}
                        {entries.length > 0 && (
                            <>
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-1 text-xs text-[var(--color-accent-emerald)] hover:underline"
                                    title="Export history as CSV"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    CSV
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="text-xs text-[var(--color-accent-rose)] hover:underline"
                                >
                                    Clear All
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-[var(--color-bg-glass)] transition-colors"
                            title="Close history panel"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    {entries.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
                            <p className="text-sm text-[var(--color-text-muted)]">
                                No analyses yet. Run your first analysis to see it here.
                            </p>
                        </div>
                    ) : (
                        entries.map((entry) => {
                            const v = entry.vehicle;
                            const a = entry.analysis;
                            const color = verdictColors[a.verdict] || "var(--color-text-secondary)";

                            return (
                                <div
                                    key={entry.id}
                                    className={`p-4 rounded-xl border transition-all group relative ${selected.has(entry.id)
                                        ? "bg-[var(--color-accent-indigo)]10 border-[var(--color-accent-indigo)]"
                                        : "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleSelect(entry.id)}
                                            className="mt-1 focus:outline-none"
                                        >
                                            {selected.has(entry.id) ? (
                                                <CheckSquare className="w-5 h-5 text-[var(--color-accent-indigo)]" />
                                            ) : (
                                                <Square className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                                                        {v.year} {v.make} {v.model}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {new Date(entry.timestamp).toLocaleDateString()} at{" "}
                                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-accent-rose)]/10 transition-all"
                                                    title="Delete this entry"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-[var(--color-accent-rose)]" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-[var(--color-text-secondary)]">
                                                        ${v.price.toLocaleString()}
                                                    </span>
                                                    <span style={{ color }}>
                                                        {a.verdict.replace(/[🔥✅⚠️🚫]\s?/, "")}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => onLoad(v, a)}
                                                    className="flex items-center gap-1 text-xs text-[var(--color-accent-indigo)] hover:underline"
                                                >
                                                    Load
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
