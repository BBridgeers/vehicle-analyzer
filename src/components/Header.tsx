"use client";

import Link from "next/link";
import { History, ArrowLeft } from "lucide-react";

interface HeaderProps {
    onToggleHistory: () => void;
    showHistory: boolean;
}

export default function Header({ onToggleHistory, showHistory }: HeaderProps) {
    return (
        <header style={{
            position: "sticky",
            top: 0,
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            height: "64px",
            background: "rgba(10,9,5,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,245,235,0.07)",
        }}>
            {/* Left — logo + back link */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                {/* Logo mark */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                    <div style={{
                        width: "34px", height: "34px",
                        background: "#d94a2a",
                        borderRadius: "4px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: "800", letterSpacing: "0.5px",
                        color: "#fff", flexShrink: 0,
                    }}>VA</div>
                    <span style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        letterSpacing: "0.4px",
                        color: "#f0ede6",
                        fontFamily: "'Bricolage Grotesque', 'Space Grotesk', sans-serif",
                    }}>
                        Vehicle Analyzer
                        <span style={{
                            marginLeft: "6px",
                            fontSize: "9px",
                            fontWeight: "700",
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            background: "rgba(217,74,42,0.18)",
                            color: "#d94a2a",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            border: "1px solid rgba(217,74,42,0.25)",
                        }}>Pro</span>
                    </span>
                </Link>

                {/* Chapter divider + page label */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingLeft: "24px",
                    borderLeft: "1px solid rgba(255,245,235,0.1)",
                }}>
                    <span style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        color: "#4a4642",
                    }}>Analysis Engine</span>
                    <span style={{
                        width: "6px", height: "6px",
                        borderRadius: "50%",
                        background: "#d94a2a",
                        animation: "pulse-dot 2s ease-in-out infinite",
                        flexShrink: 0,
                    }} />
                </div>
            </div>

            {/* Right — actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                    onClick={onToggleHistory}
                    id="history-toggle"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 16px",
                        fontSize: "11px",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: showHistory ? "#d94a2a" : "#a0998e",
                        background: showHistory ? "rgba(217,74,42,0.1)" : "transparent",
                        border: `1px solid ${showHistory ? "rgba(217,74,42,0.35)" : "rgba(255,245,235,0.1)"}`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                    }}
                >
                    <History size={14} />
                    <span className="hidden sm:inline">History</span>
                </button>

                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 16px",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "#f0ede6",
                        background: "#d94a2a",
                        borderRadius: "4px",
                        textDecoration: "none",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#c23e22")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#d94a2a")}
                >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Back</span>
                </Link>
            </div>

            <style>{`
                @keyframes pulse-dot {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%     { opacity: 0.5; transform: scale(0.6); }
                }
            `}</style>
        </header>
    );
}
