"use client";

import type { InsuranceEstimates } from "@/lib/types";

interface InsurancePanelProps {
    insurance: InsuranceEstimates;
}

export default function InsurancePanel({ insurance }: InsurancePanelProps) {
    const policies = [
        {
            name: "Personal Auto",
            monthly: insurance.personalMonthly,
            annual: insurance.personalAnnual,
            description: "Standard coverage, no rideshare",
            color: "var(--color-accent-cyan)",
        },
        {
            name: "Rideshare Endorsement",
            monthly: insurance.rideshareMonthly,
            annual: insurance.rideshareAnnual,
            description: "Part-time rideshare add-on",
            color: "var(--color-accent-indigo)",
        },
        {
            name: "Commercial Policy",
            monthly: insurance.commercialMonthly,
            annual: insurance.commercialAnnual,
            description: "Full-time rideshare coverage",
            color: "var(--color-accent-violet)",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Policy Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {policies.map((policy) => (
                    <div
                        key={policy.name}
                        className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: policy.color }}
                            />
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {policy.name}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-3">
                            {policy.description}
                        </p>
                        <p className="text-2xl font-bold" style={{ color: policy.color }}>
                            ${policy.monthly}
                            <span className="text-sm font-normal text-[var(--color-text-muted)]">/mo</span>
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            ${policy.annual.toLocaleString()}/year
                        </p>
                    </div>
                ))}
            </div>

            {/* Carrier Comparison */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                    Carrier Estimates (Personal Auto)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(insurance.carriers).map(([carrier, monthly]) => (
                        <div
                            key={carrier}
                            className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-center"
                        >
                            <p className="text-xs text-[var(--color-text-muted)] mb-1 truncate">
                                {carrier}
                            </p>
                            <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                ${monthly}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">/mo</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                * Estimates based on 35-year-old driver, clean record, Southlake TX 76092.
                Get actual quotes from carriers for final budgeting. Rates vary by driving history,
                credit score, and exact vehicle trim.
            </p>
        </div>
    );
}
