"use client";

import { Car, History, Github } from "lucide-react";

interface HeaderProps {
    onToggleHistory: () => void;
    showHistory: boolean;
}

export default function Header({ onToggleHistory, showHistory }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)]" style={{ background: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(20px)" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent-indigo)] to-[var(--color-accent-violet)] flex items-center justify-center">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-base font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Outfit, sans-serif" }}>
                                VehicleAnalyzer
                            </span>
                            <span className="text-[0.625rem] ml-1.5 px-1.5 py-0.5 rounded bg-[var(--color-accent-indigo)]/15 text-[var(--color-accent-indigo)] font-semibold uppercase tracking-wider">
                                Pro
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleHistory}
                            className={`btn-secondary flex items-center gap-2 text-sm ${showHistory ? "border-[var(--color-accent-indigo)] text-[var(--color-accent-indigo)]" : ""
                                }`}
                            id="history-toggle"
                        >
                            <History className="w-4 h-4" />
                            <span className="hidden sm:inline">History</span>
                        </button>

                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center gap-2 text-sm"
                            id="github-link"
                        >
                            <Github className="w-4 h-4" />
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
