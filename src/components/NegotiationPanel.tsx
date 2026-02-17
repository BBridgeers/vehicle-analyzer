"use client";

import type { NegotiationStrategy } from "@/lib/negotiation";

interface Props {
    negotiation: NegotiationStrategy;
    askingPrice: number;
}

export default function NegotiationPanel({ negotiation, askingPrice }: Props) {
    return (
        <div className="space-y-5">
            {/* Price targets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl p-4 border border-[var(--color-accent-emerald)] bg-[var(--color-bg-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Opening Offer</p>
                    <p className="text-2xl font-bold font-mono text-[var(--color-accent-emerald)]">
                        ${negotiation.openingOffer.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        {Math.round(((askingPrice - negotiation.openingOffer) / askingPrice) * 100)}% below asking
                    </p>
                </div>

                <div className="rounded-xl p-4 border border-[var(--color-accent-indigo)] bg-[var(--color-bg-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Target Price</p>
                    <p className="text-2xl font-bold font-mono text-[var(--color-accent-indigo)]">
                        ${negotiation.targetPrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        Save ${negotiation.savingsIfSuccessful.toLocaleString()} from asking
                    </p>
                </div>

                <div className="rounded-xl p-4 border border-[var(--color-accent-rose)] bg-[var(--color-bg-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Walk-Away Price</p>
                    <p className="text-2xl font-bold font-mono text-[var(--color-accent-rose)]">
                        ${negotiation.walkAwayPrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        Never pay above market
                    </p>
                </div>
            </div>

            {/* Price analysis */}
            <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Price Analysis</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{negotiation.priceAnalysis}</p>
            </div>

            {/* Leverage points */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">🎯 Leverage Points</h4>
                <ul className="space-y-1.5">
                    {negotiation.leveragePoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                            <span className="text-[var(--color-accent-amber)] mt-0.5">•</span>
                            {point}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Do-Not list */}
            <div className="rounded-xl p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-accent-rose)] border-opacity-30"
                style={{ borderColor: "rgba(244,63,94,0.3)" }}>
                <h4 className="text-sm font-semibold text-[var(--color-accent-rose)] mb-2">🚫 Do-Not List</h4>
                <ul className="space-y-1.5">
                    {negotiation.doNotList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                            <span className="text-[var(--color-accent-rose)] mt-0.5">✕</span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
