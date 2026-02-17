"use client";

import { Phone, ShieldAlert, MessageSquareQuote, UserCheck } from "lucide-react";
import type { SellerVerification } from "@/lib/types";

interface SellerVerificationPanelProps {
    seller: SellerVerification;
}

const responsivenessConfig: Record<string, { label: string; color: string }> = {
    "not-contacted": { label: "Not Yet Contacted", color: "var(--color-text-muted)" },
    responsive: { label: "Responsive", color: "var(--color-accent-emerald)" },
    slow: { label: "Slow to Reply", color: "var(--color-accent-amber)" },
    unresponsive: { label: "Unresponsive", color: "var(--color-accent-rose)" },
};

const transparencyConfig: Record<string, { label: string; color: string }> = {
    "not-assessed": { label: "Not Yet Assessed", color: "var(--color-text-muted)" },
    transparent: { label: "Transparent", color: "var(--color-accent-emerald)" },
    evasive: { label: "Evasive", color: "var(--color-accent-amber)" },
    dishonest: { label: "Dishonest / Contradictory", color: "var(--color-accent-rose)" },
};

export default function SellerVerificationPanel({ seller }: SellerVerificationPanelProps) {
    if (!seller.contacted) {
        return (
            <div className="p-6 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-center">
                <UserCheck className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Seller has not been contacted yet
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    After contacting the seller, update the form with your observations.
                </p>
            </div>
        );
    }

    const resp = responsivenessConfig[seller.responsiveness] || responsivenessConfig["not-contacted"];
    const trans = transparencyConfig[seller.transparency] || transparencyConfig["not-assessed"];

    return (
        <div className="space-y-5">
            {/* Communication Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-[var(--color-accent-indigo)]" />
                        <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                            Responsiveness
                        </span>
                    </div>
                    <p className="text-lg font-bold" style={{ color: resp.color }}>
                        {resp.label}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-[var(--color-accent-indigo)]" />
                        <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                            Transparency
                        </span>
                    </div>
                    <p className="text-lg font-bold" style={{ color: trans.color }}>
                        {trans.label}
                    </p>
                </div>
            </div>

            {/* Red Flags */}
            {seller.redFlags.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--color-accent-rose)]10 border border-[var(--color-accent-rose)]33">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4 text-[var(--color-accent-rose)]" />
                        <span className="text-sm font-semibold text-[var(--color-accent-rose)]">
                            Red Flags ({seller.redFlags.length})
                        </span>
                    </div>
                    <ul className="space-y-1.5">
                        {seller.redFlags.map((flag, idx) => (
                            <li key={idx} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                                <span className="text-[var(--color-accent-rose)] mt-0.5">•</span>
                                {flag}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Seller Quotes */}
            {seller.sellerQuotes && (
                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquareQuote className="w-4 h-4 text-[var(--color-accent-indigo)]" />
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Seller Quotes / Notes
                        </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap italic">
                        &ldquo;{seller.sellerQuotes}&rdquo;
                    </p>
                </div>
            )}
        </div>
    );
}
