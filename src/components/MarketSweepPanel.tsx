"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface SweepResult {
  source: string;
  title: string;
  price: number | null;
  mileage: number | null;
  year?: number;
  make?: string;
  model?: string;
  location?: string;
  url: string;
  scraped_at: string;
}

interface SweepStatus {
  sweepId: string;
  status: string;
  created_at: string;
  total_results: number;
  results: SweepResult[];
}

const SOURCE_OPTIONS = [
  { key: "craigslist", label: "Craigslist", color: "text-purple-400" },
  { key: "facebook", label: "FB Marketplace", color: "text-blue-400" },
  { key: "autotempest", label: "AutoTempest", color: "text-orange-400", disabled: true },
];

export default function MarketSweepPanel() {
  const [sources, setSources] = useState<string[]>(["craigslist"]);
  const [maxPrice, setMaxPrice] = useState(7000);
  const [maxMileage, setMaxMileage] = useState(100000);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [sweeping, setSweeping] = useState(false);
  const [sweepId, setSweepId] = useState<string | null>(null);
  const [status, setStatus] = useState<SweepStatus | null>(null);
  const [error, setError] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsFilter, setResultsFilter] = useState("");
  const [cachedResults, setCachedResults] = useState<{ results: SweepResult[]; total: number; totalPages: number; page: number } | null>(null);

  const toggleSource = (key: string) => {
    setSources((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleStartSweep = async () => {
    setSweeping(true);
    setError("");
    setStatus(null);
    try {
      const res = await fetch("/api/scrape/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources,
          maxPrice,
          maxMileage,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sweep failed");
      setSweepId(data.sweepId);
    } catch (e: any) {
      setError(e.message);
      setSweeping(false);
    }
  };

  // Poll for sweep status
  useEffect(() => {
    if (!sweepId || !sweeping) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/scrape/sweep/${sweepId}`);
        const data = await res.json();
        if (res.ok) {
          setStatus(data);
          if (data.status === "completed" || data.status === "failed") {
            setSweeping(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch { /* ignore poll errors */ }
    };

    poll(); // immediate first poll
    pollingRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sweepId, sweeping]);

  // Fetch paginated results
  const fetchResults = useCallback(async (page: number, sourceFilter: string) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/scrape/results?${params}`);
      const data = await res.json();
      if (res.ok) setCachedResults(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchResults(resultsPage, resultsFilter);
  }, [resultsPage, resultsFilter, fetchResults, status]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (resultsFilter) params.set("source", resultsFilter);
    window.open(`/api/scrape/export?${params}`, "_blank");
  };

  const handleAnalyzeVehicle = (url: string) => {
    // Navigate to main page with listing URL pre-filled
    // The main page will auto-trigger the scrape via FacebookMarketplaceScraper
    window.location.href = `/?url=${encodeURIComponent(url)}`;
  };

  const handleImportAllToFleet = async () => {
    const allResults = showResults;
    if (allResults.length === 0) return;

    if (!confirm(`Import ${allResults.length} vehicles to fleet? This saves them for analysis.`)) return;

    try {
      // Take each result and save to fleet via POST
      for (const r of allResults) {
        await fetch('/api/fleet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: r.title || `${r.make || ''} ${r.model || ''}`,
            year: r.year || '',
            make: r.make || '',
            model: r.model || '',
            price: r.price || 0,
            miles: r.mileage || 0,
            sourceUrl: r.url,
            source: r.source,
            location: r.location || '',
            status: 'pending_analysis',
          }),
        });
      }
      window.location.href = '/fleet';
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    }
  };

  const progressPct = status
    ? status.status === "completed"
      ? 100
      : status.status === "in_progress"
      ? 50
      : 0
    : 0;

  const showResults = cachedResults?.results || status?.results || [];

  return (
    <div className="space-y-6">
      {/* Sweep Controls */}
      <div className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513] flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-200">Market Sweep</h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Source checkboxes */}
          <div>
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">
              Sources
            </label>
            <div className="flex flex-wrap gap-3">
              {SOURCE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                    opt.disabled
                      ? "border-[#2a2825] opacity-40 cursor-not-allowed"
                      : sources.includes(opt.key)
                      ? "border-cyan-700 bg-cyan-900/20 text-cyan-300"
                      : "border-[#3a3730] hover:border-cyan-800 text-gray-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sources.includes(opt.key)}
                    onChange={() => toggleSource(opt.key)}
                    disabled={opt.disabled}
                    className="sr-only"
                  />
                  <span className={opt.color}>{opt.label}</span>
                  {opt.disabled && <span className="text-[9px] text-gray-600">(browser req.)</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Price / Mileage sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                Max Price: <span className="text-cyan-400">${maxPrice.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={1000}
                max={30000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>$1,000</span><span>$30,000</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                Max Mileage: <span className="text-cyan-400">{maxMileage.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={10000}
                max={200000}
                step={5000}
                value={maxMileage}
                onChange={(e) => setMaxMileage(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>10k</span><span>200k</span>
              </div>
            </div>
          </div>

          {/* Make / Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Camry"
                className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartSweep}
            disabled={sweeping || sources.length === 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {sweeping ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sweeping...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Sweep
              </>
            )}
          </button>

          {/* Progress bar */}
          {(sweeping || status) && (
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{status?.status === "completed" ? "Sweep complete" : sweeping ? "Running sweep..." : "Finished"}</span>
                <span>{status?.total_results ?? 0} vehicles found</span>
              </div>
              <div className="h-1.5 w-full bg-[#2a2825] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressPct === 100 ? "bg-emerald-500" : "bg-cyan-500"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513] flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-200">Scraped Vehicles</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportAllToFleet}
              disabled={showResults.length === 0}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-3 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Import All to Fleet
            </button>
            <select
              value={resultsFilter}
              onChange={(e) => { setResultsFilter(e.target.value); setResultsPage(1); }}
              className="bg-[#050403] border border-[#3a3730] rounded-md px-2 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-cyan-600"
            >
              <option value="">All sources</option>
              <option value="cl">Craigslist</option>
              <option value="fb">Facebook</option>
              <option value="at">AutoTempest</option>
            </select>
            <button
              onClick={handleExport}
              className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-300 px-3 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2825] text-gray-500">
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-right px-4 py-2 font-medium">Price</th>
                <th className="text-right px-4 py-2 font-medium">Mileage</th>
                <th className="text-left px-4 py-2 font-medium">Year</th>
                <th className="text-left px-4 py-2 font-medium">Make</th>
                <th className="text-left px-4 py-2 font-medium">Model</th>
                <th className="text-left px-4 py-2 font-medium">Location</th>
                <th className="text-left px-4 py-2 font-medium">Scraped At</th>
                <th className="text-center px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {showResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-600">
                    {sweeping ? "Sweep in progress..." : "No results yet. Run a sweep to populate."}
                  </td>
                </tr>
              ) : (
                showResults.map((r, i) => (
                  <tr key={i} className="border-b border-[#1e1c19] hover:bg-[#161513] transition-colors">
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        r.source === "cl" ? "bg-purple-900/30 text-purple-300" :
                        r.source === "fb" ? "bg-blue-900/30 text-blue-300" :
                        "bg-orange-900/30 text-orange-300"
                      }`}>
                        {r.source === "cl" ? "CL" : r.source === "fb" ? "FB" : "AT"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-300 max-w-[200px] truncate">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                        {r.title || "—"}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-200 font-mono">
                      {r.price ? `$${r.price.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {r.mileage ? `${r.mileage.toLocaleString()} mi` : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-300">{r.year || "—"}</td>
                    <td className="px-4 py-2 text-gray-300">{r.make || "—"}</td>
                    <td className="px-4 py-2 text-gray-300">{r.model || "—"}</td>
                    <td className="px-4 py-2 text-gray-400">{r.location || "—"}</td>
                    <td className="px-4 py-2 text-gray-500 text-[10px] whitespace-nowrap">
                      {r.scraped_at ? new Date(r.scraped_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleAnalyzeVehicle(r.url)}
                        className="bg-cyan-900/40 hover:bg-cyan-800 border border-cyan-800/50 hover:border-cyan-600 text-cyan-300 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {cachedResults && cachedResults.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#2a2825] flex items-center justify-between text-[10px] text-gray-500">
            <span>Page {cachedResults.page || resultsPage} of {cachedResults.totalPages} ({cachedResults.total} total)</span>
            <div className="flex gap-1">
              <button
                onClick={() => setResultsPage((p) => Math.max(1, p - 1))}
                disabled={resultsPage <= 1}
                className="px-2 py-1 rounded border border-[#2a2825] hover:border-cyan-700 disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setResultsPage((p) => p + 1)}
                disabled={resultsPage >= (cachedResults.totalPages || 1)}
                className="px-2 py-1 rounded border border-[#2a2825] hover:border-cyan-700 disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
