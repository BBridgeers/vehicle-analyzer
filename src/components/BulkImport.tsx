"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Table, Code, Download, CheckCircle2, AlertTriangle, X, ChevronDown, ChevronUp, Zap, Globe, Link as LinkIcon, Loader2 } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import {
    parseImportFile,
    generateCSVTemplate,
    generateMarkdownTemplate,
    generateJSONTemplate,
    type ParseResult,
} from "@/lib/import-parsers";

interface BulkImportProps {
    onImport: (vehicles: Vehicle[]) => void;
    isLoading: boolean;
}

export default function BulkImport({ onImport, isLoading }: BulkImportProps) {
    const [activeTab, setActiveTab] = useState<"file" | "url">("url");
    const [dragOver, setDragOver] = useState(false);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState(true);
    const [urlInput, setUrlInput] = useState("");
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeStatus, setScrapeStatus] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Drag & Drop handlers ──

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        setActiveTab("file");

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const processFile = async (file: File) => {
        const text = await file.text();
        const result = parseImportFile(text, file.name);
        setParseResult(result);
        // Auto-select all valid vehicles
        setSelected(new Set(result.vehicles.map((_, i) => i)));
    };

    // ── URL Import Handler ──

    const handleUrlImport = async () => {
        if (!urlInput.trim()) return;

        setIsScraping(true);
        setScrapeStatus("Initializing...");
        const urls = urlInput.split(/[\n,]+/).map(u => u.trim()).filter(u => u);

        const scrapedVehicles: Vehicle[] = [];
        const errors: string[] = [];

        for (const [index, url] of urls.entries()) {
            try {
                setScrapeStatus(`Scraping ${index + 1}/${urls.length}: ${new URL(url).hostname}...`);
                const response = await fetch('/api/import-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to scrape');
                }

                // Map ScrapedVehicle to Vehicle
                const v = data.vehicle;
                const mappedVehicle: Vehicle = {
                    year: v.year || new Date().getFullYear(),
                    make: v.make || "Unknown",
                    model: v.model || "Unknown",
                    price: v.price || 0,
                    mileage: v.mileage || 0,
                    vin: v.vin,
                    description: v.description,
                    listingUrl: v.sourceUrl,
                    source: "URL Import",
                    conditionExterior: v.conditionExterior,
                    conditionInterior: v.conditionInterior,
                    conditionMechanical: v.conditionMechanical,
                    // Defaults
                    location: v.location || "Unknown",
                    titleStatus: v.titleStatus || "Clean",
                    sellerResponsiveness: "not-contacted",
                    sellerTransparency: "not-assessed",
                    // Mapped fields
                    transmission: v.transmission,
                    fuelType: v.fuelType,
                    exteriorColor: v.exteriorColor,
                };
                scrapedVehicles.push(mappedVehicle);
            } catch (err: any) {
                console.error(err);
                errors.push(`Failed to import ${url}: ${err.message}`);
            }
        }

        setIsScraping(false);
        setScrapeStatus("");

        if (scrapedVehicles.length > 0 || errors.length > 0) {
            setParseResult({
                format: "url",
                vehicles: scrapedVehicles,
                errors: errors
            });
            setSelected(new Set(scrapedVehicles.map((_, i) => i)));
        }
    };

    // ── Template downloads ──

    const downloadTemplate = (type: "csv" | "md" | "json") => {
        const generators: Record<string, { content: string; mime: string; ext: string }> = {
            csv: { content: generateCSVTemplate(), mime: "text/csv", ext: "csv" },
            md: { content: generateMarkdownTemplate(), mime: "text/markdown", ext: "md" },
            json: { content: generateJSONTemplate(), mime: "application/json", ext: "json" },
        };
        const { content, mime, ext } = generators[type];
        const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vehicle_template.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Selection ──

    const toggleSelect = (idx: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const toggleAll = () => {
        if (!parseResult) return;
        if (selected.size === parseResult.vehicles.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(parseResult.vehicles.map((_, i) => i)));
        }
    };

    const handleAnalyzeSelected = () => {
        if (!parseResult) return;
        const vehicles = parseResult.vehicles.filter((_, i) => selected.has(i));
        if (vehicles.length > 0) {
            onImport(vehicles);
            clearImport(); // Auto-reset the UI so another URL can be pasted right away
        }
    };

    const clearImport = () => {
        setParseResult(null);
        setSelected(new Set());
        setUrlInput("");
    };

    const formatLabel: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
        csv: { icon: <Table className="w-4 h-4" />, label: "CSV", color: "var(--color-accent-emerald)" },
        json: { icon: <Code className="w-4 h-4" />, label: "JSON", color: "var(--color-accent-indigo)" },
        markdown: { icon: <FileText className="w-4 h-4" />, label: "Markdown", color: "var(--color-accent-amber)" },
        url: { icon: <Globe className="w-4 h-4" />, label: "Web Import", color: "var(--color-accent-cyan)" },
        unknown: { icon: <AlertTriangle className="w-4 h-4" />, label: "Unknown", color: "var(--color-accent-rose)" },
    };

    return (
        <div className="glass-card overflow-hidden mb-8" id="bulk-import">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--color-bg-glass-hover)] transition-colors border-b border-[var(--color-border-subtle)]"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] shadow-[inset_0_0_10px_rgba(0,240,255,0.1)]">
                        <Upload className="w-5 h-5 text-[var(--color-accent-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-mono tracking-widest uppercase text-[var(--color-text-primary)]">
                            Auto-Import & Analyze
                        </h3>
                        <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1">
                            Paste a listing URL or upload a batch file to automatically run the full analysis pipeline
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-[var(--color-accent-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
            </button>

            {expanded && (
                <div className="px-5 pb-5 space-y-4 animate-[fade-in_0.2s_ease-out]">

                    {/* Tabs */}
                    {!parseResult && (
                        <div className="flex p-1 mt-4 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] w-fit shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                            <button
                                onClick={() => setActiveTab("file")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono tracking-widest uppercase transition-all duration-200
                                    ${activeTab === "file"
                                        ? "bg-[var(--color-bg-glass-hover)] text-[var(--color-accent-lime)] border-b border-[var(--color-accent-lime)] shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-glass)]"
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                File Upload
                            </button>
                            <button
                                onClick={() => setActiveTab("url")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono tracking-widest uppercase transition-all duration-200
                                    ${activeTab === "url"
                                        ? "bg-[var(--color-bg-glass-hover)] text-[var(--color-accent-cyan)] border-b border-[var(--color-accent-cyan)] shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-glass)]"
                                    }`}
                            >
                                <LinkIcon className="w-4 h-4" />
                                Web Import
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    {!parseResult && activeTab === "file" && (
                        <div className="space-y-4 animate-[fade-in_0.2s_ease-out]">
                            {/* Template Downloads */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-[var(--color-text-muted)] mr-1">Download template:</span>
                                {(["csv", "md", "json"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => downloadTemplate(type)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                            bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)]
                                            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                                            hover:border-[var(--color-accent-indigo)] transition-all"
                                    >
                                        <Download className="w-3 h-3" />
                                        {type.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                                    ${dragOver
                                        ? "border-[var(--color-accent-indigo)] bg-indigo-500/10 scale-[1.01]"
                                        : "border-[var(--color-border-subtle)] hover:border-[var(--color-accent-indigo)]/50 hover:bg-[var(--color-bg-glass-hover)]"
                                    }`}
                            >
                                <div className={`p-3 rounded-full transition-colors ${dragOver ? "bg-indigo-500/20" : "bg-[var(--color-bg-glass)]"}`}>
                                    <Upload className={`w-6 h-6 transition-colors ${dragOver ? "text-[var(--color-accent-indigo)]" : "text-[var(--color-text-muted)]"}`} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                        {dragOver ? "Drop file here" : "Drag & drop your completed template"}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        Supports <span className="text-[var(--color-accent-emerald)]">.csv</span>
                                        {" · "}
                                        <span className="text-[var(--color-accent-indigo)]">.json</span>
                                        {" · "}
                                        <span className="text-[var(--color-accent-amber)]">.md</span>
                                        {" — or click to browse"}
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.json,.md,.markdown,.txt"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="bulk-file-input"
                                    title="Upload vehicle data file"
                                />
                            </div>
                        </div>
                    )}

                    {/* URL Import Tab */}
                    {!parseResult && activeTab === "url" && (
                        <div className="space-y-4 animate-[fade-in_0.2s_ease-out]">
                            <div className="bg-[var(--color-bg-glass)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
                                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-[var(--color-accent-emerald)]" />
                                    How it works
                                </h4>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                    Drop a Craigslist vehicle link below. The AI Agent will automatically launch a stealth browser, scrape the listing, read the seller's description, parse the VIN, analyze the car's history, and build a complete financial report for you in seconds.
                                </p>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Paste vehicle URLs here (one per line)&#10;Example: https://dallas.craigslist.org/cto/d/dallas-2015-toyota-camry/..."
                                    className="w-full h-32 p-4 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] 
                                        text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                                        focus:border-[var(--color-accent-cyan)] focus:ring-1 focus:ring-cyan-500/50 resize-none font-mono text-sm"
                                    disabled={isScraping}
                                />
                                {isScraping && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                                        <Loader2 className="w-8 h-8 text-[var(--color-accent-cyan)] animate-spin" />
                                        <span className="text-sm font-medium text-white mt-2">{scrapeStatus}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={handleUrlImport}
                                    disabled={!urlInput.trim() || isScraping}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-mono text-xs uppercase tracking-widest font-bold
                                        bg-[var(--color-accent-cyan)] text-black
                                        hover:bg-[var(--color-text-primary)]
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                        shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]
                                        transition-all duration-200"
                                >
                                    <Zap className="w-4 h-4" />
                                    Execute Import
                                </button>
                            </div>

                            <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-glass)] p-3 rounded-lg border border-[var(--color-border-subtle)]">
                                <span className="font-semibold text-[var(--color-text-primary)]">Supported Sources:</span>
                                <ul className="mt-1 list-disc list-inside space-y-0.5 ml-1">
                                    <li>Craigslist (US & Canada)</li>
                                    <li>AutoTempest</li>
                                    <li className="text-[var(--color-text-disabled)] opacity-50 line-through">Cars & Bids (Coming Later)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Parse Results */}
                    {parseResult && (
                        <div className="space-y-3 animate-[slide-up_0.3s_ease-out]">
                            {/* Status Bar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, ${formatLabel[parseResult.format].color} 15%, transparent)`,
                                            color: formatLabel[parseResult.format].color,
                                        }}
                                    >
                                        {formatLabel[parseResult.format].icon}
                                        {formatLabel[parseResult.format].label}
                                    </div>
                                    <span className="text-sm text-[var(--color-text-primary)]">
                                        <CheckCircle2 className="w-4 h-4 inline text-[var(--color-accent-emerald)] mr-1" />
                                        Parsed <strong>{parseResult.vehicles.length}</strong> vehicle{parseResult.vehicles.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <button
                                    onClick={clearImport}
                                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-glass-hover)] transition-colors"
                                    title="Clear import"
                                >
                                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </button>
                            </div>

                            {/* Errors */}
                            {parseResult.errors.length > 0 && (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                    {parseResult.errors.map((err, i) => (
                                        <p key={i} className="text-xs text-[var(--color-accent-rose)] flex items-start gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            {err}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Vehicle Table */}
                            {parseResult.vehicles.length > 0 && (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-[var(--color-border-subtle)]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-[var(--color-bg-glass)]">
                                                    <th className="p-2 text-left w-8">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.size === parseResult.vehicles.length}
                                                            onChange={toggleAll}
                                                            className="accent-[var(--color-accent-indigo)] cursor-pointer"
                                                            id="select-all-vehicles"
                                                            title="Select all vehicles"
                                                        />
                                                    </th>
                                                    <th className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Year</th>
                                                    <th className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Make</th>
                                                    <th className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Model</th>
                                                    <th className="p-2 text-right text-xs font-medium text-[var(--color-text-muted)]">Price</th>
                                                    <th className="p-2 text-right text-xs font-medium text-[var(--color-text-muted)]">Mileage</th>
                                                    <th className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Location</th>
                                                    <th className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Source</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parseResult.vehicles.map((v, i) => (
                                                    <tr
                                                        key={i}
                                                        onClick={() => toggleSelect(i)}
                                                        className={`cursor-pointer transition-colors border-t border-[var(--color-border-subtle)]
                                                            ${selected.has(i)
                                                                ? "bg-indigo-500/5"
                                                                : "hover:bg-[var(--color-bg-glass-hover)]"
                                                            }`}
                                                    >
                                                        <td className="p-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected.has(i)}
                                                                onChange={() => toggleSelect(i)}
                                                                className="accent-[var(--color-accent-indigo)] cursor-pointer"
                                                                title={`Select vehicle ${i + 1}`}
                                                            />
                                                        </td>
                                                        <td className="p-2 text-[var(--color-text-primary)] font-medium">{v.year}</td>
                                                        <td className="p-2 text-[var(--color-text-primary)]">{v.make}</td>
                                                        <td className="p-2 text-[var(--color-text-primary)]">{v.model}</td>
                                                        <td className="p-2 text-right text-[var(--color-accent-emerald)] font-medium">
                                                            ${v.price.toLocaleString()}
                                                        </td>
                                                        <td className="p-2 text-right text-[var(--color-text-secondary)]">
                                                            {v.mileage.toLocaleString()} mi
                                                        </td>
                                                        <td className="p-2 text-[var(--color-text-muted)] text-xs">{v.location || "—"}</td>
                                                        <td className="p-2 text-[var(--color-text-muted)] text-xs">{v.source || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {selected.size} of {parseResult.vehicles.length} selected
                                        </p>
                                        <button
                                            onClick={handleAnalyzeSelected}
                                            disabled={selected.size === 0 || isLoading}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-mono text-xs uppercase tracking-widest font-bold
                                                bg-[var(--color-accent-lime)] text-black
                                                hover:bg-[var(--color-text-primary)]
                                                disabled:opacity-40 disabled:cursor-not-allowed
                                                shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]
                                                transition-all duration-200"
                                            id="analyze-selected-btn"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Analyze {selected.size} Vehicle{selected.size !== 1 ? "s" : ""}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
