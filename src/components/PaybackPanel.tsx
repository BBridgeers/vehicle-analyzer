"use client";

interface Props {
    paybackWeeks: { conservative: number; baseline: number; optimistic: number };
    vehiclePrice: number;
    weeklyEarnings: { conservative: number; baseline: number; optimistic: number };
}

export default function PaybackPanel({ paybackWeeks, vehiclePrice, weeklyEarnings }: Props) {
    const scenarios = [
        { label: "Conservative", weeks: paybackWeeks.conservative, earnings: weeklyEarnings.conservative, color: "var(--color-accent-amber)" },
        { label: "Baseline", weeks: paybackWeeks.baseline, earnings: weeklyEarnings.baseline, color: "var(--color-accent-indigo)" },
        { label: "Optimistic", weeks: paybackWeeks.optimistic, earnings: weeklyEarnings.optimistic, color: "var(--color-accent-emerald)" },
    ];

    const maxWeeks = Math.max(...scenarios.map((s) => Math.min(s.weeks, 52)));

    return (
        <div className="space-y-5">
            <p className="text-sm text-[var(--color-text-secondary)]">
                How long to recoup your ${vehiclePrice.toLocaleString()} investment through rideshare:
            </p>

            {/* Timeline bars */}
            <div className="space-y-3">
                {scenarios.map((s) => {
                    const pct = maxWeeks > 0 ? Math.min(100, (s.weeks / Math.max(maxWeeks, 1)) * 100) : 0;
                    const months = Math.round((s.weeks / 4.33) * 10) / 10;
                    return (
                        <div key={s.label}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{s.label}</span>
                                <span className="text-sm font-mono" style={{ color: s.color }}>
                                    {s.weeks === Infinity ? "Never" : `${s.weeks} weeks (~${months} mo)`}
                                </span>
                            </div>
                            <div className="w-full h-6 rounded-lg bg-[var(--color-bg-secondary)] overflow-hidden">
                                <div
                                    className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                                    style={{
                                        width: s.weeks === Infinity ? "100%" : `${Math.max(8, pct)}%`,
                                        backgroundColor: s.color,
                                        opacity: s.weeks === Infinity ? 0.3 : 1,
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-white">
                                        ${s.earnings.toFixed(0)}/wk
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cumulative earnings table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                            <th className="text-left py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Timeframe</th>
                            <th className="text-right py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Conservative</th>
                            <th className="text-right py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Baseline</th>
                            <th className="text-right py-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Optimistic</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { label: "Week 13 (3 mo)", mult: 13 },
                            { label: "Week 26 (6 mo)", mult: 26 },
                            { label: "Week 39 (9 mo)", mult: 39 },
                            { label: "Week 52 (1 yr)", mult: 52 },
                        ].map((row) => (
                            <tr key={row.label} className="border-b border-[var(--color-border-subtle)]">
                                <td className="py-2 text-[var(--color-text-secondary)]">{row.label}</td>
                                <td className="py-2 text-right font-mono text-[var(--color-text-primary)]">
                                    ${Math.round(weeklyEarnings.conservative * row.mult).toLocaleString()}
                                </td>
                                <td className="py-2 text-right font-mono text-[var(--color-text-primary)]">
                                    ${Math.round(weeklyEarnings.baseline * row.mult).toLocaleString()}
                                </td>
                                <td className="py-2 text-right font-mono text-[var(--color-text-primary)]">
                                    ${Math.round(weeklyEarnings.optimistic * row.mult).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
