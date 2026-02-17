"use client";

import type { StructuredVerdict } from "@/lib/types";

interface Props {
    structuredVerdict: StructuredVerdict;
}

export default function FinalVerdictPanel({ structuredVerdict }: Props) {
    const v = structuredVerdict;

    const verdictColors: Record<string, string> = {
        "🔥 STRONG BUY": "var(--color-verdict-strong)",
        "✅ RECOMMENDED": "var(--color-verdict-recommended)",
        "⚠️ PROCEED WITH CAUTION": "var(--color-verdict-caution)",
        "🚫 AVOID": "var(--color-verdict-avoid)",
    };

    const color = verdictColors[v.verdict] || "var(--color-text-secondary)";

    return (
        <div className="space-y-5">
            {/* Confidence meter */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--color-text-secondary)]">Analysis Confidence</span>
                        <span className="text-sm font-bold font-mono" style={{ color }}>{v.confidence}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${v.confidence}%`, backgroundColor: color }}
                        />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        {v.confidence >= 85 ? "High confidence — comprehensive data available" :
                            v.confidence >= 65 ? "Moderate confidence — consider adding more data (VIN, description)" :
                                "Low confidence — limited data points available"}
                    </p>
                </div>
            </div>

            {/* Buy If / Walk Away If */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-accent-emerald)]"
                    style={{ borderColor: "rgba(16,185,129,0.4)" }}>
                    <h4 className="text-sm font-semibold text-[var(--color-accent-emerald)] mb-3">✅ Buy If...</h4>
                    <ul className="space-y-2">
                        {v.buyIf.map((condition, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                                <span className="text-[var(--color-accent-emerald)] shrink-0 mt-0.5">✓</span>
                                {condition}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-accent-rose)]"
                    style={{ borderColor: "rgba(244,63,94,0.4)" }}>
                    <h4 className="text-sm font-semibold text-[var(--color-accent-rose)] mb-3">🚫 Walk Away If...</h4>
                    <ul className="space-y-2">
                        {v.walkAwayIf.map((condition, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                                <span className="text-[var(--color-accent-rose)] shrink-0 mt-0.5">✕</span>
                                {condition}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Red flags */}
            {v.redFlags.length > 0 && (
                <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-accent-amber)]"
                    style={{ borderColor: "rgba(245,158,11,0.4)" }}>
                    <h4 className="text-sm font-semibold text-[var(--color-accent-amber)] mb-2">⚠️ Red Flags Detected</h4>
                    <div className="flex flex-wrap gap-2">
                        {v.redFlags.map((flag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{
                                    backgroundColor: "rgba(245,158,11,0.15)",
                                    color: "var(--color-accent-amber)",
                                }}
                            >
                                {flag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
