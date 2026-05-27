"use client";

import React from "react";
import Link from "next/link";
import MarketSweepPanel from "@/components/MarketSweepPanel";

export default function SweepsPage() {
  return (
    <div className="flex h-screen w-full bg-[#0a0905] text-gray-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#11100e] border-r border-[#262420] flex flex-col h-full z-10 flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-[#262420]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white tracking-widest text-sm">VA</div>
            <span className="font-bold text-lg tracking-wider text-gray-100">V.E.R.A.</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 border-b border-[#262420]">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            New Evaluation
          </Link>
          <Link href="/sweeps" className="flex items-center gap-3 px-3 py-2 bg-[#1e1c19] text-cyan-400 rounded-md text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Market Sweep
          </Link>
        </nav>

        <div className="p-4 border-t border-[#262420] mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-100 font-bold text-sm">JS</div>
            <div>
              <div className="text-sm font-medium">Blake</div>
              <div className="text-xs text-gray-500">Pro Analyst</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-[#0a0905]">
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#262420] flex-shrink-0 bg-[#0a0905]/80 backdrop-blur z-10">
          <h1 className="text-xl font-semibold text-gray-100">Market Sweep</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <MarketSweepPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
