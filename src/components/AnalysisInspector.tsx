import React, { useState } from 'react';
import { AnalysisResult, Vehicle, ScoringFactor } from '@/lib/types';
import { X, Search, Code, Scale, Info } from 'lucide-react';

interface AnalysisInspectorProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: AnalysisResult;
    vehicle: Vehicle;
}

export default function AnalysisInspector({ isOpen, onClose, analysis, vehicle }: AnalysisInspectorProps) {
    const [activeTab, setActiveTab] = useState<'input' | 'scoring' | 'raw'>('scoring');

    if (!isOpen) return null;

    const breakdown = analysis.scoringBreakdown;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-[scale-up_0.2s_ease-out]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-[var(--color-accent-purple)]" />
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                            Vehicle Inspector <span className="text-xs font-normal text-[var(--color-text-muted)] ml-2 opacity-70">Under the Hood</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-surface)] rounded-full text-[var(--color-text-muted)] transition-colors"
                        aria-label="Close Inspector"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                    <button
                        onClick={() => setActiveTab('scoring')}
                        className={`flexItems-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'scoring'
                            ? 'border-[var(--color-accent-purple)] text-[var(--color-accent-purple)]'
                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Scale className="w-4 h-4" />
                        Scoring Logic
                    </button>
                    <button
                        onClick={() => setActiveTab('input')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'input'
                            ? 'border-[var(--color-accent-purple)] text-[var(--color-accent-purple)]'
                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Search className="w-4 h-4" />
                        Analyzed Data
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'raw'
                            ? 'border-[var(--color-accent-purple)] text-[var(--color-accent-purple)]'
                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Code className="w-4 h-4" />
                        Raw JSON
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-subtle)]">

                    {/* SCORING TAB */}
                    {activeTab === 'scoring' && breakdown && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-[var(--color-bg-card)] p-6 rounded-lg border border-[var(--color-border)]">
                                <div>
                                    <div className="text-sm text-[var(--color-text-muted)] mb-1">Total Verdict Score</div>
                                    <div className="text-4xl font-bold bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-indigo)] bg-clip-text text-transparent">
                                        {breakdown.totalScore} / 100
                                    </div>
                                    <div className="text-sm font-medium mt-1 text-[var(--color-text-primary)]">
                                        Verdict: {breakdown.verdict}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-[var(--color-text-muted)]">Base Score</div>
                                    <div className="text-2xl font-mono text-[var(--color-text-secondary)]">{breakdown.baseScore}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">Factor Breakdown</h3>
                                {breakdown.factors.map((factor, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${factor.points > 0 ? 'bg-[var(--color-accent-emerald)]' :
                                                factor.points < 0 ? 'bg-[var(--color-accent-rose)]' : 'bg-[var(--color-text-muted)]'
                                                }`} />
                                            <div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{factor.label}</div>
                                                {factor.description && (
                                                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{factor.description}</div>
                                                )}
                                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mt-1 opacity-60 bg-[var(--color-bg-surface)] inline-block px-1.5 py-0.5 rounded">
                                                    {factor.category}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-mono font-bold text-lg ${factor.points > 0 ? 'text-[var(--color-accent-emerald)]' :
                                            factor.points < 0 ? 'text-[var(--color-accent-rose)]' : 'text-[var(--color-text-muted)]'
                                            }`}>
                                            {factor.points > 0 ? '+' : ''}{factor.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* INPUT TAB */}
                    {activeTab === 'input' && (
                        <div className="space-y-4">
                            <div className="bg-[var(--color-accent-indigo)]10 border border-[var(--color-accent-indigo)]20 p-4 rounded-lg flex gap-3 text-sm text-[var(--color-accent-indigo)]">
                                <Info className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    This is the <strong>Cleaned Data</strong> the analyzer actually used. If something looks wrong here (like Mileage = 0), check the Raw JSON tab to see if the scraper missed it.
                                </div>
                            </div>

                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left font-medium text-[var(--color-text-muted)] py-2 border-b border-[var(--color-border)]">Field</th>
                                        <th className="text-left font-medium text-[var(--color-text-muted)] py-2 border-b border-[var(--color-border)]">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(vehicle).map(([key, value]) => {
                                        if (key === 'description' || typeof value === 'object') return null;
                                        return (
                                            <tr key={key} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface)]">
                                                <td className="py-2 text-[var(--color-text-secondary)] font-mono text-xs">{key}</td>
                                                <td className="py-2 text-[var(--color-text-primary)] font-medium">
                                                    {value === undefined || value === null ? <span className="text-[var(--color-accent-rose)] opacity-70">null</span> : value.toString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* RAW JSON TAB */}
                    {activeTab === 'raw' && (
                        <div>
                            <div className="bg-[var(--color-accent-amber)]10 border border-[var(--color-accent-amber)]20 p-4 rounded-lg flex gap-3 text-sm text-[var(--color-accent-amber)] mb-4">
                                <Info className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    Raw JSON dump of the analyzed vehicle object.
                                </div>
                            </div>
                            <pre className="p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto">
                                {JSON.stringify(vehicle, null, 2)}
                            </pre>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
