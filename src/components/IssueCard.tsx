"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CriticalIssue } from "@/lib/types";

interface IssueCardProps {
    issue: CriticalIssue;
    index: number;
}

export default function IssueCard({ issue, index }: IssueCardProps) {
    const [expanded, setExpanded] = useState(false);

    const severityClass = `badge badge-${issue.severity}`;

    return (
        <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] overflow-hidden transition-all hover:border-[var(--color-border-default)]">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono text-[var(--color-text-muted)] shrink-0">
                        #{index}
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {issue.title}
                    </span>
                    <span className={severityClass}>{issue.severity}</span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 ml-2" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 ml-2" />
                )}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 animate-[slide-down_0.2s_ease-out] border-t border-[var(--color-border-subtle)]">
                    <div className="pt-3">
                        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                            Concern
                        </p>
                        <p className="text-sm text-[var(--color-text-primary)]">{issue.concern}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-[var(--color-bg-glass)]">
                            <p className="text-xs uppercase tracking-wider text-[var(--color-accent-emerald)] mb-1">
                                ✓ Benign Explanation
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">{issue.benign}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--color-bg-glass)]">
                            <p className="text-xs uppercase tracking-wider text-[var(--color-accent-rose)] mb-1">
                                ✗ Malicious Explanation
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">{issue.malicious}</p>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--color-accent-indigo)]/5 border border-[var(--color-accent-indigo)]/15">
                        <p className="text-xs uppercase tracking-wider text-[var(--color-accent-indigo)] mb-1">
                            ⚡ Action Required
                        </p>
                        <p className="text-sm text-[var(--color-text-primary)]">{issue.action}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
