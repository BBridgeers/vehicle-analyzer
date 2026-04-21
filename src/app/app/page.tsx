"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import VehicleForm from "@/components/VehicleForm";
import AnalysisResults from "@/components/AnalysisResults";
import HistoryPanel from "@/components/HistoryPanel";
import ComparisonView from "@/components/ComparisonView";
import BulkImport from "@/components/BulkImport";
import ListingCapture from "@/components/ListingCapture";
import Toast from "@/components/Toast";
import ChatWidget from "@/components/ChatWidget";
import type { Vehicle, AnalysisResult, AnalysisMode } from "@/lib/types";
import { analyzeVehicle } from "@/lib/analyze";
import { saveToHistory } from "@/lib/history";
import { downloadDocxReport } from "@/lib/export-docx";
import { FileText, Search } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";



export default function Home() {
    const pageRef = useScrollReveal(0.1);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonSelection, setComparisonSelection] = useState<string[]>([]);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("rideshare");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    // Batch results
    const [batchResults, setBatchResults] = useState<Array<{ vehicle: Vehicle; analysis: AnalysisResult }>>([]);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

    const [showForm, setShowForm] = useState(true);

    // Deep Link Catcher (from Export CSVs)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const carParam = params.get('car');
            if (carParam) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(carParam));
                    // Push to the back of the event loop to ensure state is ready
                    setTimeout(() => handleAnalyze(parsed), 100);
                } catch (e) {
                    console.error("Failed to parse deep link car:", e);
                }
            }
        }
    }, []); // Run ONLY on mount

    const handleAnalyze = useCallback(async (v: Vehicle) => {
        setIsAnalyzing(true);
        setAnalysis(null);
        setBatchResults([]);

        try {
            let vinData = undefined;
            // specific check for 17 chars to avoid bad requests
            if (v.vin && v.vin.length === 17) {
                try {
                    const timeout = new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error("VIN timeout")), 5000)
                    );
                    const res = await Promise.race([
                        fetch('/api/vin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ vin: v.vin })
                        }),
                        timeout
                    ]) as Response;
                    if (res.ok) {
                        vinData = await res.json();
                    }
                } catch (e) {
                    console.error("VIN fetch failed or timed out, proceeding without VIN data:", e);
                }
            }

            const result = analyzeVehicle(v, vinData);
            setVehicle(v);
            setAnalysis(result);
            saveToHistory(v, result);
            setShowForm(false); // Collapse form
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

        // Single vehicle? Just analyze normally
        if (vehicles.length === 1) {
            handleAnalyze(vehicles[0]);
            return;
        }

        // Batch analyze
        setIsAnalyzing(true);
        setAnalysis(null);
        setVehicle(null);
        setBatchResults([]);
        setBatchProgress({ current: 0, total: vehicles.length });

        const results: Array<{ vehicle: Vehicle; analysis: AnalysisResult }> = [];

        for (let i = 0; i < vehicles.length; i++) {
            setBatchProgress({ current: i + 1, total: vehicles.length });

            const vehicle = vehicles[i];
            let vinData = undefined;
            if (vehicle.vin && vehicle.vin.length === 17) {
                try {
                    const res = await fetch('/api/vin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vin: vehicle.vin })
                    });
                    if (res.ok) vinData = await res.json();
                } catch (e) {
                    console.error("Batch VIN fetch failed", e);
                }
            }

            try {
                const result = analyzeVehicle(vehicle, vinData);
                saveToHistory(vehicle, result);
                results.push({ vehicle: vehicle, analysis: result });
            } catch (err) {
                console.error(`Failed to analyze vehicle ${i + 1}:`, err);
            }
        }

        setBatchResults(results);
        setBatchProgress(null);
        setIsAnalyzing(false);

        if (results.length > 0) {
            // Show the first result as the active one
            setVehicle(results[0].vehicle);
            setAnalysis(results[0].analysis);
            setShowForm(false); // Collapse form
            showToast(`${results.length} vehicle${results.length > 1 ? "s" : ""} analyzed!`, "success");
        }
    };

    const handleLoadHistory = (v: Vehicle, a: AnalysisResult) => {
        setVehicle(v);
        setAnalysis(a);
        setShowHistory(false);
        setBatchResults([]);
        setShowForm(false); // Collapse form
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

    const selectBatchResult = (idx: number) => {
        const item = batchResults[idx];
        if (item) {
            setVehicle(item.vehicle);
            setAnalysis(item.analysis);
        }
    };

    const handleCompare = (ids: string[]) => {
        setComparisonSelection(ids);
        setShowHistory(false);
        setShowComparison(true);
    };

    return (
        <main className="app-shell" ref={pageRef as React.RefObject<HTMLElement>}>
            {/* Cinematic grain overlay — editorial texture */}
            <div className="grain-overlay" aria-hidden="true" />
            <Header
                onToggleHistory={() => setShowHistory(!showHistory)}
                showHistory={showHistory}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" style={{ position: "relative", zIndex: 1 }}>
                {/* ── App Hero Section ── */}
                <section className="reveal" style={{
                    paddingTop: "52px",
                    paddingBottom: "40px",
                    textAlign: "center",
                }}>
                    {/* Chapter label */}
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "10px",
                        fontWeight: "700",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        color: "#4a4642",
                        marginBottom: "20px",
                    }}>
                        <span style={{ display: "block", width: "32px", height: "1px", background: "#2a2722" }} />
                        ANALYSIS ENGINE
                        <span style={{ display: "block", width: "32px", height: "1px", background: "#2a2722" }} />
                    </div>

                    <h1 style={{
                        fontFamily: "'Bricolage Grotesque', 'Space Grotesk', sans-serif",
                        fontSize: "clamp(36px, 5vw, 68px)",
                        fontWeight: "900",
                        lineHeight: "0.92",
                        letterSpacing: "-2px",
                        textTransform: "uppercase",
                        margin: "0 0 18px 0",
                        color: "#f0ede6",
                    }}>
                        KNOW THE DEAL
                        <span style={{ display: "block", color: "#d94a2a" }}>BEFORE YOU BUY.</span>
                    </h1>

                    <p style={{
                        fontSize: "15px",
                        color: "#6a6660",
                        maxWidth: "560px",
                        margin: "0 auto 32px auto",
                        lineHeight: "1.65",
                    }}>
                        Paste a screenshot or enter details manually. Get a full intelligence
                        report — market value, red flags, rideshare projections, and a negotiation script.
                    </p>

                    {/* Mode Toggle + New Scan */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                        {/* Mode toggle */}
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px",
                            background: "#0e0d08",
                            border: "1px solid rgba(255,245,235,0.08)",
                            borderRadius: "4px",
                        }}>
                            <button
                                onClick={() => setAnalysisMode("rideshare")}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "3px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    fontFamily: "inherit",
                                    background: analysisMode === "rideshare" ? "#d94a2a" : "transparent",
                                    color: analysisMode === "rideshare" ? "#fff" : "#6a6660",
                                    boxShadow: analysisMode === "rideshare" ? "0 0 16px rgba(217,74,42,0.3)" : "none",
                                }}
                            >Rideshare Mode</button>
                            <button
                                onClick={() => setAnalysisMode("personal")}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "3px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    fontFamily: "inherit",
                                    background: analysisMode === "personal" ? "#1c6ea4" : "transparent",
                                    color: analysisMode === "personal" ? "#fff" : "#6a6660",
                                    boxShadow: analysisMode === "personal" ? "0 0 16px rgba(28,110,164,0.3)" : "none",
                                }}
                            >Personal Use</button>
                        </div>

                        {/* New scan toggle */}
                        <button
                            onClick={() => { setShowForm(!showForm); setShowComparison(false); }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "9px 20px",
                                fontSize: "11px",
                                fontWeight: "700",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                                background: "transparent",
                                border: "1px solid rgba(255,245,235,0.14)",
                                borderRadius: "4px",
                                color: "#a0998e",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                fontFamily: "inherit",
                            }}
                        >
                            {showForm ? "− Collapse Form" : "+ New Scan"}
                        </button>
                    </div>
                </section>

                {/* Comparison View */}
                {showComparison && (
                    <ComparisonView
                        onClose={() => setShowComparison(false)}
                        initialSelection={comparisonSelection}
                    />
                )}

                {/* History Panel (slide overlay) */}
                {showHistory && (
                    <HistoryPanel
                        onClose={() => setShowHistory(false)}
                        onLoad={handleLoadHistory}
                        onCompare={handleCompare}
                    />
                )}

                {/* ── SCREENSHOT IMPORT ── */}
                <section className="reveal" style={{ marginBottom: "20px" }}>
                    <ListingCapture
                        onExtracted={handleAnalyze}
                        onUrlUpdate={(url) => setVehicle(prev => prev ? { ...prev, listingUrl: url } : prev)}
                        isLoading={isAnalyzing}
                    />
                </section>

                {/* ── BULK IMPORT ── */}
                <section className="reveal" style={{ marginBottom: "16px" }}>
                    <BulkImport onImport={handleBulkImport} isLoading={isAnalyzing} />
                </section>

                {/* Form Section */}
                {showForm ? (
                    <section className="reveal" style={{ marginBottom: "40px" }}>
                        <VehicleForm onSubmit={handleAnalyze} isLoading={isAnalyzing} initialData={vehicle} />
                    </section>
                ) : (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-secondary"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
                        >
                            <Search size={14} />
                            Edit Vehicle Details / New Analysis
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                    <section style={{ marginBottom: "40px" }}>
                        <div className="glass-card" style={{ padding: "40px 32px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
                                <div style={{
                                    width: "18px", height: "18px",
                                    border: "2px solid #d94a2a",
                                    borderTopColor: "transparent",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite",
                                }} />
                                <span style={{ fontSize: "16px", fontWeight: "600", color: "#f0ede6" }}>
                                    {batchProgress
                                        ? `Analyzing vehicle ${batchProgress.current} of ${batchProgress.total}...`
                                        : "Running analysis..."
                                    }
                                </span>
                            </div>
                            {batchProgress && (
                                <div style={{ maxWidth: "400px", margin: "16px auto 0" }}>
                                    <div style={{ height: "3px", background: "rgba(255,245,235,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            background: "linear-gradient(to right, #d94a2a, #c2602a)",
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
                                            <div className="shimmer" style={{ height: "12px", width: "80px", margin: "0 auto" }} />
                                            <div className="shimmer" style={{ height: "32px", width: "100%" }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── BATCH RESULTS SELECTOR ── */}
                {batchResults.length > 1 && !isAnalyzing && (
                    <section style={{ marginBottom: "32px", animation: "slide-up 0.3s ease-out" }}>
                        <div className="glass-card" style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <h3 style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "#d94a2a" }}>
                                    ── Batch Results — {batchResults.length} vehicles
                                </h3>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px" }}>
                                {batchResults.map((item, i) => {
                                    const isActive = vehicle === item.vehicle;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => selectBatchResult(i)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "12px 14px",
                                                borderRadius: "4px",
                                                textAlign: "left",
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                                transition: "all 0.2s",
                                                background: isActive ? "rgba(217,74,42,0.1)" : "rgba(255,245,235,0.03)",
                                                border: isActive ? "1px solid rgba(217,74,42,0.35)" : "1px solid rgba(255,245,235,0.07)",
                                            }}
                                        >
                                            <div>
                                                <p style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede6", margin: 0 }}>
                                                    {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                                                </p>
                                                <p style={{ fontSize: "11px", color: "#6a6660", margin: "2px 0 0" }}>
                                                    ${item.vehicle.price.toLocaleString()} · {item.vehicle.mileage.toLocaleString()} mi
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: "12px", fontWeight: "700", margin: 0, color: item.analysis.instantEquity >= 0 ? "#22c55e" : "#ef4444" }}>
                                                    ${item.analysis.instantEquity.toLocaleString()}
                                                </p>
                                                <p style={{ fontSize: "10px", color: "#6a6660", margin: "2px 0 0" }}>
                                                    {item.analysis.verdictScore}/100
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Results */}
                {analysis && vehicle && !isAnalyzing && (
                    <section className="reveal">
                        {/* DOCX Export Button */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                            <button
                                onClick={handleExportDocx}
                                id="export-docx-btn"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 16px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                    background: "transparent",
                                    border: "1px solid rgba(255,245,235,0.12)",
                                    borderRadius: "4px",
                                    color: "#6a6660",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(217,74,42,0.4)"; e.currentTarget.style.color = "#d94a2a"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,245,235,0.12)"; e.currentTarget.style.color = "#6a6660"; }}
                            >
                                <FileText size={13} />
                                Download DOCX Report
                            </button>
                        </div>
                        <AnalysisResults vehicle={vehicle} analysis={analysis} mode={analysisMode} />
                    </section>
                )}
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* VERA — Context-Aware AI Chat Assistant */}
            <ChatWidget vehicle={vehicle} analysis={analysis} />
        </main>
    );
}
