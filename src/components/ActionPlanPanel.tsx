"use client";

import { ExternalLink } from "lucide-react";
import type { ActionPlan } from "@/lib/action-plan";

interface Props {
    actionPlan: ActionPlan;
}

export default function ActionPlanPanel({ actionPlan }: Props) {
    const priorityColors = {
        critical: "var(--color-accent-rose)",
        high: "var(--color-accent-amber)",
        medium: "var(--color-accent-indigo)",
    };

    return (
        <div className="space-y-5">
            {/* Steps */}
            <div className="space-y-3">
                {actionPlan.steps.map((step) => (
                    <div
                        key={step.step}
                        className="rounded-xl p-4 border transition-all hover:border-[var(--color-accent-indigo)]"
                        style={{
                            backgroundColor: "var(--color-bg-secondary)",
                            borderColor: "var(--color-border-subtle)",
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                                style={{ backgroundColor: priorityColors[step.priority] }}
                            >
                                {step.step}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">{step.title}</h4>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-2">{step.description}</p>
                                {step.links.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {step.links.map((link) => (
                                            <a
                                                key={link.url}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-[var(--color-accent-indigo)] hover:border-[var(--color-accent-indigo)] transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                {link.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Research links grid */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wider">
                    Quick Research Links
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {actionPlan.researchUrls.map((link) => (
                        <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-indigo)] transition-all hover:scale-[1.02] text-sm text-[var(--color-text-primary)]"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-accent-indigo)] shrink-0" />
                            <span className="truncate">{link.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
