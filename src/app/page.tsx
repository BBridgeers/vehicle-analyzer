"use client";

import { useState } from "react";
import Header from "@/components/Header";
import VehicleForm from "@/components/VehicleForm";
import AnalysisResults from "@/components/AnalysisResults";
import HistoryPanel from "@/components/HistoryPanel";
import ComparisonView from "@/components/ComparisonView";
import BulkImport from "@/components/BulkImport";
import Toast from "@/components/Toast";
import type { Vehicle, AnalysisResult } from "@/lib/types";
import { analyzeVehicle } from "@/lib/analyze";
import { saveToHistory } from "@/lib/history";
import { downloadDocxReport } from "@/lib/export-docx";
import { BarChart3, FileText } from "lucide-react";

export type AnalysisMode = "rideshare" | "personal";

export default function Home() {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("rideshare");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    // Batch results
    const [batchResults, setBatchResults] = useState<Array<{ vehicle: Vehicle; analysis: AnalysisResult }>>([]);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

    const handleAnalyze = async (v: Vehicle) => {
        setIsAnalyzing(true);
        setAnalysis(null);
        setBatchResults([]);

        await new Promise((r) => setTimeout(r, 400));

        try {
            const result = analyzeVehicle(v);
            setVehicle(v);
            setAnalysis(result);
            saveToHistory(v, result);
            showToast("Analysis complete!", "success");
        } catch (err) {
            console.error(err);
            showToast("Analysis failed. Please check your inputs.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

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
            await new Promise((r) => setTimeout(r, 200)); // Animation pacing

            try {
                const result = analyzeVehicle(vehicles[i]);
                saveToHistory(vehicles[i], result);
                results.push({ vehicle: vehicles[i], analysis: result });
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
            showToast(`${results.length} vehicle${results.length > 1 ? "s" : ""} analyzed!`, "success");
        }
    };

    const handleLoadHistory = (v: Vehicle, a: AnalysisResult) => {
        setVehicle(v);
        setAnalysis(a);
        setShowHistory(false);
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

    const selectBatchResult = (idx: number) => {
        const item = batchResults[idx];
        if (item) {
            setVehicle(item.vehicle);
            setAnalysis(item.analysis);
        }
    };

    return (
        <main className="min-h-screen">
            <Header
                onToggleHistory={() => setShowHistory(!showHistory)}
                showHistory={showHistory}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Hero Section */}
                <section className="pt-12 pb-16 text-center animate-[fade-in_0.6s_ease-out]">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] mb-6">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent-emerald)] animate-pulse" />
                        Powered by NHTSA VIN Database
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
                        <span className="gradient-text">Vehicle Analyzer</span>{" "}
                        <span className="text-[var(--color-text-primary)]">Pro</span>
                    </h1>
                    <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-6">
                        Data-driven used vehicle analysis with market valuations, rideshare
                        projections, insurance estimates, and professional report generation.
                    </p>

                    {/* Mode Toggle + Compare Button */}
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        {/* Toggle */}
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)]">
                            <button
                                onClick={() => setAnalysisMode("rideshare")}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${analysisMode === "rideshare"
                                    ? "bg-[var(--color-accent-indigo)] text-white shadow-lg shadow-indigo-500/25"
                                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                    }`}
                            >
                                🚗 Rideshare
                            </button>
                            <button
                                onClick={() => setAnalysisMode("personal")}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${analysisMode === "personal"
                                    ? "bg-[var(--color-accent-indigo)] text-white shadow-lg shadow-indigo-500/25"
                                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                    }`}
                            >
                                🏠 Personal Use
                            </button>
                        </div>

                        {/* Compare */}
                        <button
                            onClick={() => setShowComparison(!showComparison)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-indigo)] transition-all"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Compare Vehicles
                        </button>
                    </div>
                </section>

                {/* Comparison View */}
                {showComparison && (
                    <ComparisonView onClose={() => setShowComparison(false)} />
                )}

                {/* History Panel (slide overlay) */}
                {showHistory && (
                    <HistoryPanel
                        onClose={() => setShowHistory(false)}
                        onLoad={handleLoadHistory}
                    />
                )}

                {/* ── BULK IMPORT ── */}
                <section className="mb-4">
                    <BulkImport onImport={handleBulkImport} isLoading={isAnalyzing} />
                </section>

                {/* Form Section */}
                <section className="mb-12">
                    <VehicleForm onSubmit={handleAnalyze} isLoading={isAnalyzing} />
                </section>

                {/* Loading State */}
                {isAnalyzing && (
                    <section className="mb-12">
                        <div className="glass-card p-8 text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-5 h-5 rounded-full border-2 border-[var(--color-accent-indigo)] border-t-transparent animate-spin" />
                                <span className="text-lg font-medium text-[var(--color-text-primary)]">
                                    {batchProgress
                                        ? `Analyzing vehicle ${batchProgress.current} of ${batchProgress.total}...`
                                        : "Analyzing vehicle..."
                                    }
                                </span>
                            </div>
                            {batchProgress && (
                                <div className="w-full max-w-md mx-auto mt-4">
                                    <div className="h-2 rounded-full bg-[var(--color-bg-glass)] overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {!batchProgress && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    {["Market Values", "Critical Issues", "Rideshare", "Insurance"].map((label) => (
                                        <div key={label} className="space-y-2">
                                            <div className="shimmer h-4 w-24 mx-auto" />
                                            <div className="shimmer h-8 w-full" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── BATCH RESULTS SELECTOR ── */}
                {batchResults.length > 1 && !isAnalyzing && (
                    <section className="mb-8 animate-[slide-up_0.3s_ease-out]">
                        <div className="glass-card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                    📊 Batch Results — {batchResults.length} vehicles analyzed
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {batchResults.map((item, i) => {
                                    const isActive = vehicle === item.vehicle;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => selectBatchResult(i)}
                                            className={`flex items-center justify-between p-3 rounded-lg text-left transition-all
                                                ${isActive
                                                    ? "bg-indigo-500/15 border border-[var(--color-accent-indigo)] shadow-sm"
                                                    : "bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-indigo)]/50"
                                                }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                    {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    ${item.vehicle.price.toLocaleString()} · {item.vehicle.mileage.toLocaleString()} mi
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-medium ${item.analysis.instantEquity >= 0 ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-accent-rose)]"}`}>
                                                    ${item.analysis.instantEquity.toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-[var(--color-text-muted)]">
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
                    <section className="animate-[slide-up_0.5s_ease-out]">
                        {/* DOCX Export Button */}
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={handleExportDocx}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                                    bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)]
                                    text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                                    hover:border-[var(--color-accent-indigo)] transition-all"
                                id="export-docx-btn"
                            >
                                <FileText className="w-4 h-4" />
                                Download DOCX Report
                            </button>
                        </div>
                        <AnalysisResults vehicle={vehicle} analysis={analysis} mode={analysisMode} />
                    </section>
                )}
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}
        </main>
    );
}
