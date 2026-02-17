"use client";

import { Wrench, Eye, Armchair, Camera } from "lucide-react";
import type { ConditionAssessment } from "@/lib/types";

interface ConditionPanelProps {
    condition: ConditionAssessment;
}

const severityColors: Record<string, string> = {
    good: "var(--color-accent-emerald)",
    fair: "var(--color-accent-amber)",
    worn: "var(--color-accent-orange, #f97316)",
    replace: "var(--color-accent-rose)",
};

const severityLabels: Record<string, string> = {
    good: "Good",
    fair: "Fair",
    worn: "Worn",
    replace: "Needs Replacement",
};

export default function ConditionPanel({ condition }: ConditionPanelProps) {
    const hasNotes = condition.exteriorNotes || condition.interiorNotes || condition.mechanicalNotes;

    return (
        <div className="space-y-6">
            {/* User-entered condition notes */}
            {hasNotes ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {condition.exteriorNotes && (
                        <NoteCard
                            icon={<Eye className="w-4 h-4" />}
                            title="Exterior"
                            notes={condition.exteriorNotes}
                        />
                    )}
                    {condition.interiorNotes && (
                        <NoteCard
                            icon={<Armchair className="w-4 h-4" />}
                            title="Interior"
                            notes={condition.interiorNotes}
                        />
                    )}
                    {condition.mechanicalNotes && (
                        <NoteCard
                            icon={<Wrench className="w-4 h-4" />}
                            title="Mechanical"
                            notes={condition.mechanicalNotes}
                        />
                    )}
                </div>
            ) : (
                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        No condition notes entered. Add notes in the form for a more detailed assessment.
                    </p>
                </div>
            )}

            {/* Expected Condition Checklist */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                    Expected Condition at This Mileage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {condition.expectedChecklist.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]"
                        >
                            <span className="text-sm text-[var(--color-text-primary)]">
                                {item.item}
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{
                                        color: severityColors[item.expected],
                                        backgroundColor: severityColors[item.expected] + "18",
                                    }}
                                >
                                    {severityLabels[item.expected]}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Future feature placeholder */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border-subtle)]">
                <Camera className="w-5 h-5 text-[var(--color-text-muted)]" />
                <div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                        AI Photo Analysis — Coming Soon
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Upload photos to get AI-powered condition scoring and damage detection.
                    </p>
                </div>
            </div>
        </div>
    );
}

function NoteCard({ icon, title, notes }: { icon: React.ReactNode; title: string; notes: string }) {
    return (
        <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--color-accent-indigo)]">{icon}</span>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{notes}</p>
        </div>
    );
}
