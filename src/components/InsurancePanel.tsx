"use client";

import type { InsuranceEstimates } from "@/lib/types";

interface InsurancePanelProps {
    insurance: InsuranceEstimates;
}

export default function InsurancePanel({ insurance }: InsurancePanelProps) {
    const isLiability = insurance.coverageType === "Liability Only";

    const policies: {
        name: string;
        monthly: number;
        annual: number;
        description: string;
        color: string;
        info: string;
    }[] = [
            {
                name: isLiability ? "Liability Only" : "Personal Full Coverage",
                monthly: insurance.personalMonthly,
                annual: insurance.personalAnnual,
                description: isLiability ? "State minimum liability (No Comp/Coll)" : "Standard comprehensive & collision",
                color: "var(--color-accent-cyan)",
                info: "SCENARIO: You commute to your day job or go for groceries. This covers you 100% when the Uber/Lyft app is OFF. NOTE: It will likely deny any claim if the app was ON, even if you had no passenger.",
            },
            {
                name: "Rideshare Endorsement",
                monthly: insurance.rideshareMonthly,
                annual: insurance.rideshareAnnual,
                description: isLiability
                    ? `Liability + ~$${insurance.endorsementCost} endorsement`
                    : "Full coverage + rideshare gap",
                color: "var(--color-accent-indigo)",
                info: "SCENARIO: You turn the app ON and wait for a ride. You are now in 'Period 1'. This endorsement bridges the gap where your Personal policy denies you and Uber's insurance is very weak/non-existent.",
            },
            {
                name: "Commercial Policy",
                monthly: insurance.commercialMonthly,
                annual: insurance.commercialAnnual,
                description: "Full-time rideshare coverage",
                color: "var(--color-accent-violet)",
                info: "SCENARIO: You are a full-time Black Car / Limousine driver. This provides primary insurance 24/7 regardless of app status. It is overkill for standard UberX unless local laws require it for your specific vehicle class.",
            },
        ];

    return (
        <div className="space-y-6">
            {/* Policy Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {policies.map((policy) => (
                    <div
                        key={policy.name}
                        className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] relative group"
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

                        {/* Period 1 Gap Info */}
                        {/* @ts-ignore */}
                        {policy.info && (
                            <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                                <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
                                    {/* @ts-ignore */}
                                    <span className="text-[var(--color-accent-indigo)] font-medium">Why?</span> {policy.info}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Coverage Note */}
            {isLiability && (
                <div className="p-3 rounded-lg bg-[var(--color-accent-indigo)]/10 border border-[var(--color-accent-indigo)]/20 text-xs text-[var(--color-text-secondary)]">
                    <strong>Note:</strong> Since this vehicle is valued under $7k, estimates reflect <strong>Liability Only</strong>. Uber/Lyft do <u>not</u> require Comprehensive/Collision coverage unless the vehicle is financed.
                </div>
            )}

            {/* Carrier Comparison */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                    Carrier Estimates ({isLiability ? "Liability Only" : "Full Coverage"})
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
