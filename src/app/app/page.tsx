"use client";

import { useState, useEffect, useCallback } from "react";
import VehicleForm from "@/components/VehicleForm";
import AnalysisResults from "@/components/AnalysisResults";
import ComparisonView from "@/components/ComparisonView";
import BulkImport from "@/components/BulkImport";
import ListingCapture from "@/components/ListingCapture";
import Toast from "@/components/Toast";
import ChatWidget from "@/components/ChatWidget";
import type { Vehicle, AnalysisResult, AnalysisMode } from "@/lib/types";
import { analyzeVehicle } from "@/lib/analyze";
import { saveToHistory, getHistory, deleteFromHistory } from "@/lib/history";
import { downloadDocxReport } from "@/lib/export-docx";
import { FileText, Home, BarChart2, TrendingUp, Clock, X, Trash2, ArrowRight, Download, RefreshCw, ChevronDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { HistoryEntry } from "@/lib/types";

// ─── Sidebar History List (inline, no overlay) ──────────────────────────────

function SidebarHistoryList({
    onLoad,
    activeVehicle,
    refreshKey,
}: {
    onLoad: (v: Vehicle, a: AnalysisResult) => void;
    activeVehicle: Vehicle | null;
    refreshKey: number;
}) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        setEntries(getHistory().slice(0, 12));
    }, [refreshKey]);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteFromHistory(id);
        setEntries(getHistory().slice(0, 12));
    };

    const badgeColor = (verdict: string) => {
        if (verdict.includes("STRONG BUY")) return { bg: "#099969", label: "Good" };
        if (verdict.includes("RECOMMENDED")) return { bg: "#099969", label: "Good" };
        if (verdict.includes("CAUTION")) return { bg: "#E4B600", label: "Fair" };
        return { bg: "#EB1C22", label: "Risk" };
    };

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        if (h < 1) return "Just now";
        if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
        if (d < 7) return d === 1 ? "Yesterday" : `${d} days ago`;
        return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    if (entries.length === 0) {
        return (
            <div style={{ padding: "20px 12px", textAlign: "center" }}>
                <Clock size={22} style={{ color: "#9BAAC2", margin: "0 auto 8px", opacity: 0.5 }} />
                <p style={{ fontSize: "11px", color: "#9BAAC2", lineHeight: 1.5 }}>
                    No analyses yet. Run your first scan to see it here.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {entries.map((entry) => {
                const v = entry.vehicle;
                const a = entry.analysis;
                const badge = badgeColor(a.verdict);
                const isActive = activeVehicle?.make === v.make && activeVehicle?.model === v.model && activeVehicle?.year === v.year;

                return (
                    <button
                        key={entry.id}
                        onClick={() => onLoad(v, a)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            background: isActive ? "rgba(39, 53, 143, 0.12)" : "transparent",
                            border: isActive ? "1px solid rgba(39, 53, 143, 0.25)" : "1px solid transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s",
                            width: "100%",
                            fontFamily: "inherit",
                            position: "relative",
                            group: "true",
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#27358F", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {v.year} {v.make} {v.model}
                            </p>
                            <p style={{ fontSize: "10px", color: "#8898B0", margin: 0 }}>
                                ${v.price.toLocaleString()} · {timeAgo(entry.timestamp)}
                            </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <span style={{
                                fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                                borderRadius: "3px", background: badge.bg, color: "#fff",
                                letterSpacing: "0.5px", textTransform: "uppercase",
                            }}>
                                {badge.label}
                            </span>
                            <button
                                onClick={(e) => handleDelete(e, entry.id)}
                                style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    padding: "2px", color: "#C0C8D8", borderRadius: "3px",
                                    display: "flex", alignItems: "center",
                                }}
                                title="Delete"
                            >
                                <X size={11} />
                            </button>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AppPage() {
    const pageRef = useScrollReveal(0.1);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonSelection, setComparisonSelection] = useState<string[]>([]);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("rideshare");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [batchResults, setBatchResults] = useState<Array<{ vehicle: Vehicle; analysis: AnalysisResult }>>([]);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [historyKey, setHistoryKey] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<"import" | "manual" | "bulk">("import");

    // ── Deep Link Catcher ──
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const carParam = params.get("car");
            if (carParam) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(carParam));
                    setTimeout(() => handleAnalyze(parsed), 100);
                } catch (e) {
                    console.error("Failed to parse deep link car:", e);
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnalyze = useCallback(async (v: Vehicle) => {
        setIsAnalyzing(true);
        setAnalysis(null);
        setBatchResults([]);

        try {
            let vinData = undefined;
            if (v.vin && v.vin.length === 17) {
                try {
                    const timeout = new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error("VIN timeout")), 5000)
                    );
                    const res = await Promise.race([
                        fetch("/api/vin", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ vin: v.vin }),
                        }),
                        timeout,
                    ]) as Response;
                    if (res.ok) vinData = await res.json();
                } catch (e) {
                    console.error("VIN fetch failed or timed out:", e);
                }
            }

            const result = analyzeVehicle(v, vinData);
            setVehicle(v);
            setAnalysis(result);
            saveToHistory(v, result);
            setHistoryKey(k => k + 1);
            showToast("Analysis complete!", "success");
        } catch (err) {
            console.error(err);
            showToast("Analysis failed. Please check your inputs.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBulkImport = async (vehicles: Vehicle[]) => {
        if (vehicles.length === 0) return;
        if (vehicles.length === 1) { handleAnalyze(vehicles[0]); return; }

        setIsAnalyzing(true);
        setAnalysis(null);
        setVehicle(null);
        setBatchResults([]);
        setBatchProgress({ current: 0, total: vehicles.length });

        const results: Array<{ vehicle: Vehicle; analysis: AnalysisResult }> = [];

        for (let i = 0; i < vehicles.length; i++) {
            setBatchProgress({ current: i + 1, total: vehicles.length });
            const veh = vehicles[i];
            let vinData = undefined;
            if (veh.vin && veh.vin.length === 17) {
                try {
                    const res = await fetch("/api/vin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ vin: veh.vin }),
                    });
                    if (res.ok) vinData = await res.json();
                } catch (e) {
                    console.error("Batch VIN fetch failed", e);
                }
            }
            try {
                const result = analyzeVehicle(veh, vinData);
                saveToHistory(veh, result);
                results.push({ vehicle: veh, analysis: result });
            } catch (err) {
                console.error(`Failed to analyze vehicle ${i + 1}:`, err);
            }
        }

        setBatchResults(results);
        setBatchProgress(null);
        setIsAnalyzing(false);
        setHistoryKey(k => k + 1);

        if (results.length > 0) {
            setVehicle(results[0].vehicle);
            setAnalysis(results[0].analysis);
            showToast(`${results.length} vehicle${results.length > 1 ? "s" : ""} analyzed!`, "success");
        }
    };

    const handleLoadHistory = (v: Vehicle, a: AnalysisResult) => {
        setVehicle(v);
        setAnalysis(a);
        setBatchResults([]);
        showToast("Loaded from history", "success");
    };

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleExportDocx = async () => {
        if (!vehicle || !analysis) return;
        try {
            await downloadDocxReport(vehicle, analysis);
            showToast("DOCX report downloaded!", "success");
        } catch (err) {
            console.error(err);
            showToast("DOCX export failed.", "error");
        }
    };

    const handleCompare = (ids: string[]) => {
        setComparisonSelection(ids);
        setShowComparison(true);
    };

    const verdictBadge = (verdict: string) => {
        if (verdict.includes("STRONG BUY")) return { color: "#099969", label: "STRONG BUY" };
        if (verdict.includes("RECOMMENDED")) return { color: "#099969", label: "GOOD BUY" };
        if (verdict.includes("CAUTION")) return { color: "#E4B600", label: "FAIR" };
        return { color: "#EB1C22", label: "AVOID" };
    };

    return (
        <div className="vera-shell" ref={pageRef as React.RefObject<HTMLDivElement>}>

            {/* ════════════════════════════════════════════════
                LEFT SIDEBAR
            ════════════════════════════════════════════════ */}
            <aside className={`vera-sidebar ${sidebarCollapsed ? "vera-sidebar--collapsed" : ""}`}>
                {/* Logo */}
                <div className="vera-sidebar__logo">
                    <div className="vera-logo-mark">
                        <span>VA</span>
                    </div>
                    {!sidebarCollapsed && <span className="vera-logo-text">V.E.R.A.</span>}
                    <button
                        className="vera-sidebar__collapse-btn"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronDown size={14} style={{ transform: sidebarCollapsed ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="vera-sidebar__nav">
                    <button
                        className="vera-nav-item vera-nav-item--active"
                        onClick={() => { setShowComparison(false); setAnalysis(null); setVehicle(null); }}
                    >
                        <Home size={15} />
                        {!sidebarCollapsed && <span>New Evaluation</span>}
                    </button>
                    <button
                        className="vera-nav-item"
                        onClick={() => handleCompare([])}
                    >
                        <BarChart2 size={15} />
                        {!sidebarCollapsed && <span>Fleet Dashboard</span>}
                    </button>
                    <button className="vera-nav-item">
                        <TrendingUp size={15} />
                        {!sidebarCollapsed && <span>Market Analytics</span>}
                    </button>
                </nav>

                {/* Analysis History */}
                {!sidebarCollapsed && (
                    <div className="vera-sidebar__history">
                        <div className="vera-sidebar__section-header">
                            <span>ANALYSIS HISTORY</span>
                            <button
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#8898B0", padding: "2px" }}
                                onClick={() => setHistoryKey(k => k + 1)}
                                title="Refresh"
                            >
                                <RefreshCw size={11} />
                            </button>
                        </div>
                        <SidebarHistoryList
                            onLoad={handleLoadHistory}
                            activeVehicle={vehicle}
                            refreshKey={historyKey}
                        />
                    </div>
                )}

                {/* User Profile */}
                {!sidebarCollapsed && (
                    <div className="vera-sidebar__user">
                        <div className="vera-user-avatar">JS</div>
                        <div>
                            <p className="vera-user-name">Pro Analyst</p>
                            <p className="vera-user-role">Vehicle Intelligence</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* ════════════════════════════════════════════════
                CENTER WORKSHEET
            ════════════════════════════════════════════════ */}
            <main className="vera-worksheet">
                {/* Top Bar */}
                <div className="vera-worksheet__topbar">
                    <h1 className="vera-worksheet__title">Vehicle Evaluation Worksheet</h1>
                    <div className="vera-topbar-actions">
                        {/* Mode Toggle */}
                        <div className="vera-mode-toggle">
                            <button
                                className={`vera-mode-btn${analysisMode === "rideshare" ? " vera-mode-btn--active" : ""}`}
                                onClick={() => setAnalysisMode("rideshare")}
                            >
                                Rideshare
                            </button>
                            <button
                                className={`vera-mode-btn${analysisMode === "personal" ? " vera-mode-btn--active-blue" : ""}`}
                                onClick={() => setAnalysisMode("personal")}
                            >
                                Personal Use
                            </button>
                        </div>
                        <button
                            className="vera-btn-clear"
                            onClick={() => { setAnalysis(null); setVehicle(null); setBatchResults([]); }}
                        >
                            <RefreshCw size={13} />
                            Clear Form
                        </button>
                        <button
                            className="vera-btn-run"
                            onClick={() => {
                                const form = document.querySelector("form");
                                if (form) form.requestSubmit();
                            }}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
                        </button>
                    </div>
                </div>

                {/* Scrollable Worksheet Content */}
                <div className="vera-worksheet__body">
                    {showComparison && (
                        <ComparisonView
                            onClose={() => setShowComparison(false)}
                            initialSelection={comparisonSelection}
                        />
                    )}

                    {/* ─ Data Import & Media Card ─ */}
                    <div className="vera-card reveal">
                        <div className="vera-card__header">
                            <Download size={15} />
                            <span>Data Import &amp; Media</span>
                        </div>

                        {/* Tab Switcher */}
                        <div className="vera-import-tabs">
                            <button
                                className={`vera-import-tab${activeTab === "import" ? " vera-import-tab--active" : ""}`}
                                onClick={() => setActiveTab("import")}
                            >
                                URL / Screenshot
                            </button>
                            <button
                                className={`vera-import-tab${activeTab === "manual" ? " vera-import-tab--active" : ""}`}
                                onClick={() => setActiveTab("manual")}
                            >
                                Manual Entry
                            </button>
                            <button
                                className={`vera-import-tab${activeTab === "bulk" ? " vera-import-tab--active" : ""}`}
                                onClick={() => setActiveTab("bulk")}
                            >
                                Bulk Import
                            </button>
                        </div>

                        {activeTab === "import" && (
                            <ListingCapture
                                onExtracted={handleAnalyze}
                                onUrlUpdate={(url) => setVehicle(prev => prev ? { ...prev, listingUrl: url } : prev)}
                                isLoading={isAnalyzing}
                            />
                        )}

                        {activeTab === "bulk" && (
                            <div style={{ padding: "16px 0 0" }}>
                                <BulkImport onImport={handleBulkImport} isLoading={isAnalyzing} />
                            </div>
                        )}
                    </div>

                    {/* ─ Core Vehicle Identity Form ─ */}
                    {(activeTab === "manual" || activeTab === "import") && (
                        <div className="vera-card reveal">
                            <div className="vera-card__header">
                                <Home size={15} />
                                <span>Core Vehicle Identity</span>
                            </div>
                            <VehicleForm onSubmit={handleAnalyze} isLoading={isAnalyzing} initialData={vehicle} />
                        </div>
                    )}

                    {/* ─ Batch Results Selector ─ */}
                    {batchResults.length > 1 && !isAnalyzing && (
                        <div className="vera-card reveal" style={{ padding: "20px 24px" }}>
                            <div className="vera-card__header">
                                <BarChart2 size={15} />
                                <span>Batch Results — {batchResults.length} vehicles</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px", marginTop: "12px" }}>
                                {batchResults.map((item, i) => {
                                    const isActive = vehicle === item.vehicle;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setVehicle(item.vehicle); setAnalysis(item.analysis); }}
                                            style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "12px 14px", borderRadius: "6px", textAlign: "left",
                                                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                                                background: isActive ? "rgba(39,53,143,0.08)" : "rgba(39,53,143,0.03)",
                                                border: isActive ? "1px solid rgba(39,53,143,0.35)" : "1px solid rgba(39,53,143,0.1)",
                                            }}
                                        >
                                            <div>
                                                <p style={{ fontSize: "13px", fontWeight: 600, color: "#27358F", margin: 0 }}>
                                                    {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                                                </p>
                                                <p style={{ fontSize: "11px", color: "#8898B0", margin: "2px 0 0" }}>
                                                    ${item.vehicle.price.toLocaleString()} · {item.vehicle.mileage.toLocaleString()} mi
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: "12px", fontWeight: 700, margin: 0, color: item.analysis.instantEquity >= 0 ? "#099969" : "#EB1C22" }}>
                                                    ${item.analysis.instantEquity.toLocaleString()}
                                                </p>
                                                <p style={{ fontSize: "10px", color: "#8898B0", margin: "2px 0 0" }}>
                                                    {item.analysis.verdictScore}/100
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─ Loading State ─ */}
                    {isAnalyzing && (
                        <div className="vera-card" style={{ padding: "40px 32px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
                                <div className="vera-spinner" />
                                <span style={{ fontSize: "15px", fontWeight: 600, color: "#27358F" }}>
                                    {batchProgress
                                        ? `Analyzing vehicle ${batchProgress.current} of ${batchProgress.total}...`
                                        : "Running AI analysis..."}
                                </span>
                            </div>
                            {batchProgress && (
                                <div style={{ maxWidth: "400px", margin: "0 auto" }}>
                                    <div style={{ height: "4px", background: "rgba(39,53,143,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            background: "linear-gradient(to right, #27358F, #00ADEF)",
                                            borderRadius: "2px",
                                            transition: "width 0.4s ease",
                                            width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                                        }} />
                                    </div>
                                </div>
                            )}
                            {!batchProgress && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "24px" }}>
                                    {["Market Values", "Critical Issues", "Rideshare", "Insurance"].map((label) => (
                                        <div key={label} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <div className="vera-shimmer" style={{ height: "10px", width: "80px", margin: "0 auto" }} />
                                            <div className="vera-shimmer" style={{ height: "28px", width: "100%" }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* ════════════════════════════════════════════════
                RIGHT PANEL — VERA Results
            ════════════════════════════════════════════════ */}
            <aside className="vera-results-panel">
                {/* VERA Status Header */}
                <div className="vera-results-panel__header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className={`vera-status-dot ${analysis ? "vera-status-dot--active" : "vera-status-dot--idle"}`} />
                        <span className="vera-status-label">
                            {analysis ? "VERA AI ACTIVE" : "VERA AI READY"}
                        </span>
                    </div>
                    {analysis && (
                        <span style={{ fontSize: "11px", color: "#8898B0" }}>Analysis: Complete</span>
                    )}
                </div>

                {/* Results body */}
                <div className="vera-results-panel__body">
                    {!analysis && !isAnalyzing && (
                        <div className="vera-results-empty">
                            <div className="vera-results-empty__icon">
                                <TrendingUp size={28} style={{ color: "#27358F", opacity: 0.4 }} />
                            </div>
                            <p style={{ fontSize: "13px", color: "#8898B0", lineHeight: 1.6, textAlign: "center", margin: 0 }}>
                                Import a listing URL, paste a screenshot, or enter vehicle details to get your full intelligence report.
                            </p>
                        </div>
                    )}

                    {analysis && vehicle && !isAnalyzing && (
                        <div className="reveal">
                            {/* Market Value Analysis */}
                            <div className="vera-result-section">
                                <div className="vera-result-section__label">MARKET VALUE ANALYSIS</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                    <div className="vera-market-price">
                                        ${analysis.marketValues.privatePartyAvg.toLocaleString()}
                                    </div>
                                    <div
                                        className="vera-verdict-pill"
                                        style={{ background: verdictBadge(analysis.verdict).color }}
                                    >
                                        {verdictBadge(analysis.verdict).label}
                                    </div>
                                </div>
                                <div className="vera-price-range">
                                    <span>Low: ${analysis.marketValues.privatePartyLow?.toLocaleString() ?? "—"}</span>
                                    <span>Avg: ${analysis.marketValues.privatePartyAvg.toLocaleString()}</span>
                                    <span>High: ${analysis.marketValues.dealerRetail.toLocaleString()}</span>
                                </div>
                                <div className="vera-price-bar">
                                    <div className="vera-price-bar__track">
                                        <div
                                            className="vera-price-bar__fill"
                                            style={{
                                                width: `${Math.min(100, Math.max(5, ((vehicle.price - (analysis.marketValues.privatePartyLow ?? vehicle.price * 0.8)) / (analysis.marketValues.dealerRetail - (analysis.marketValues.privatePartyLow ?? vehicle.price * 0.8))) * 100))}%`
                                            }}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: "11px", color: "#8898B0", marginTop: "8px", lineHeight: 1.5 }}>
                                    {analysis.instantEquity >= 0
                                        ? `Asking price is $${analysis.instantEquity.toLocaleString()} below private party average.`
                                        : `Asking price is $${Math.abs(analysis.instantEquity).toLocaleString()} above private party average.`
                                    }
                                </p>
                            </div>

                            {/* Overall Score */}
                            <div className="vera-result-section">
                                <div className="vera-result-section__label">OVERALL SCORE</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div className={`vera-score-ring ${analysis.verdictScore >= 70 ? "vera-score-ring--good" : analysis.verdictScore >= 50 ? "vera-score-ring--fair" : "vera-score-ring--bad"}`}>
                                        <span>{analysis.verdictScore}</span>
                                        <small>/100</small>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "12px", fontWeight: 700, color: "#27358F", margin: 0 }}>
                                            {analysis.verdict.replace(/[🔥✅⚠️🚫]\s?/, "")}
                                        </p>
                                        {analysis.criticalIssues.length > 0 && (
                                            <p style={{ fontSize: "11px", color: "#EB1C22", margin: "3px 0 0" }}>
                                                {analysis.criticalIssues.length} critical issue{analysis.criticalIssues.length > 1 ? "s" : ""} found
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="vera-result-section">
                                <div className="vera-result-section__label">KEY METRICS</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                    {[
                                        { label: "Instant Equity", value: `$${analysis.instantEquity.toLocaleString()}`, color: analysis.instantEquity >= 0 ? "#099969" : "#EB1C22" },
                                        { label: "Payback (wks)", value: `${analysis.paybackWeeks.baseline}`, color: "#27358F" },
                                        { label: "Est. Insurance", value: `$${analysis.insurance.personalMonthly}/mo`, color: "#27358F" },
                                        { label: "Market Position", value: analysis.verdictScore >= 70 ? "Below Market" : "At/Above Market", color: analysis.verdictScore >= 70 ? "#099969" : "#E4B600" },
                                    ].map(metric => (
                                        <div key={metric.label} className="vera-metric-chip">
                                            <span className="vera-metric-chip__label">{metric.label}</span>
                                            <span className="vera-metric-chip__value" style={{ color: metric.color }}>{metric.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Critical Issues if any */}
                            {analysis.criticalIssues.length > 0 && (
                                <div className="vera-result-section">
                                    <div className="vera-result-section__label" style={{ color: "#EB1C22" }}>
                                        RED FLAGS ({analysis.criticalIssues.length})
                                    </div>
                                    {analysis.criticalIssues.slice(0, 3).map((issue, i) => (
                                        <div key={i} className="vera-red-flag">
                                            <span className="vera-red-flag__dot" />
                                            <span style={{ fontSize: "11px", color: "#27358F" }}>{issue.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Full Report Button */}
                            <div className="vera-result-section">
                                <button
                                    className="vera-btn-full-report"
                                    onClick={() => {
                                        const el = document.getElementById("full-analysis-section");
                                        el?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    <ArrowRight size={13} /> View Full Report
                                </button>
                                <button
                                    className="vera-btn-export"
                                    onClick={handleExportDocx}
                                >
                                    <FileText size={13} /> Download DOCX
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* VERA Chat pinned at bottom */}
                <div className="vera-chat-anchor">
                    <ChatWidget vehicle={vehicle} analysis={analysis} />
                </div>
            </aside>

            {/* ════════════════════════════════════════════════
                FULL ANALYSIS (below fold, center column only)
            ════════════════════════════════════════════════ */}
            {analysis && vehicle && !isAnalyzing && (
                <div className="vera-full-report" id="full-analysis-section">
                    <div className="vera-full-report__inner reveal">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#27358F", margin: 0, letterSpacing: "-0.5px" }}>
                                Full Intelligence Report — {vehicle.year} {vehicle.make} {vehicle.model}
                            </h2>
                        </div>
                        <AnalysisResults vehicle={vehicle} analysis={analysis} mode={analysisMode} />
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}
