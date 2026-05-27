"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import VERAWidget from '@/components/VERAWidget';
import { useRouter } from 'next/navigation';

const customStyles: Record<string, React.CSSProperties> = {
  body: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#0a0905',
    color: '#d1d5db',
  },
  glassCard: {
    background: 'linear-gradient(145deg, rgba(20,19,17,1) 0%, rgba(10,9,5,1) 100%)',
    border: '1px solid #262420',
  },
  winnerGlow: {
    border: '1px solid #10b981',
    boxShadow: '0 0 30px rgba(16, 185, 129, 0.05)',
    position: 'relative' as 'relative',
  },
  metricLabelCol: {
    width: '280px',
    flexShrink: 0,
    borderRight: '1px solid #262420',
  },
  vehicleCol: {
    flex: 1,
    borderRight: '1px solid #262420',
  },
  vehicleColLast: {
    flex: 1,
  },
  cliffMarker: {
    position: 'absolute',
    top: '-4px',
    bottom: '-4px',
    width: '2px',
    background: '#ef4444',
  },
  cliffLabel: {
    position: 'absolute',
    top: '-18px',
    fontSize: '8px',
    fontWeight: 900,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  gaugeContainer: {
    position: 'relative',
    width: '100px',
    height: '100px',
  },
};

const tierBadgeBase = {
  fontSize: '10px',
  fontWeight: 800,
  padding: '4px 10px',
  borderRadius: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const Header = ({ activeNav }: { activeNav: string; setActiveNav?: (id: string) => void }) => {
  return (
    <header className="h-20 bg-[#0d0c0a] border-b border-[#262420] flex items-center justify-between px-8 shrink-0 z-50">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span className="font-black text-2xl tracking-tighter text-white uppercase">V.E.R.A.</span>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${activeNav === 'new' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Evaluation
          </Link>
          <Link
            href="/fleet"
            className={`px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${activeNav === 'fleet' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Fleet Dashboard
          </Link>
          <Link
            href="/comparison"
            className={`px-5 py-2 rounded-lg text-sm font-black flex items-center gap-2 ${activeNav === 'matrix' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-800/30' : 'text-gray-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Comparison Matrix
          </Link>
          <Link
            href="/analytics"
            className={`px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${activeNav === 'analytics' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            Market Analytics
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-[#262420]">
          <div className="text-right">
            <div className="text-sm font-bold text-white">Blake</div>
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Fleet Director</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-cyan-900/40 border border-cyan-700/50 flex items-center justify-center font-black text-cyan-100 text-xs">JS</div>
        </div>
        <button onClick={() => {}} disabled className="w-10 h-10 flex items-center justify-center text-gray-700 cursor-not-allowed transition-colors" title="Settings coming in next update">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    </header>
  );
};

const SubHeader = ({ engineMode, setEngineMode }: { engineMode: string; setEngineMode: (mode: string) => void }) => {
  const router = useRouter();

  const handleExportCSV = () => {
    const headers = ['Metric', '2019 Honda Civic Sport', '2019 Toyota RAV4 Hybrid', '2018 Mazda CX-9 XL'];
    const rows = [
      ['I-Score', '87', '74', '68'],
      ['Rideshare Tier', 'Uber X (1.0x)', 'Comfort (1.2x)', 'Uber XL (1.5x)'],
      ['Asking Price', '$18,500', '$24,200', '$21,800'],
      ['Est. Negotiated', '$16,200', '$22,800', '$21,100'],
      ['Equity Surplus', '+$2,950', '+$1,450', '+$820'],
      ['Insurance (Liability)', '$142/mo', '$168/mo', '$212/mo'],
      ['Insurance (+Rideshare)', '$38/mo', '$45/mo', '$62/mo'],
      ['Mileage', '42,000', '102,400', '128,100'],
      ['Pre-Flight Repair Cost', '$240', '$850', '$2,450'],
    ];
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comparison-matrix.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-16 bg-[#0a0905]/80 backdrop-blur-xl border-b border-[#262420] flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">Engine Mode:</span>
          <div className="flex bg-[#141311] p-1 rounded-lg border border-[#262420]">
            <button
              onClick={() => setEngineMode('2up')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all ${engineMode === '2up' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 rounded-md' : 'text-gray-400 hover:text-white'}`}
            >
              2-Up
            </button>
            <button
              onClick={() => setEngineMode('3up')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all ${engineMode === '3up' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 rounded-md' : 'text-gray-400 hover:text-white'}`}
            >
              3-Up Triad
            </button>
            <button
              onClick={() => setEngineMode('4up')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all ${engineMode === '4up' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 rounded-md' : 'text-gray-400 hover:text-white'}`}
            >
              4+ Matrix
            </button>
          </div>
        </div>
        <div className="h-6 w-px bg-[#262420]"></div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Assets:</span>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-emerald-900/20 border border-emerald-900/40 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">Civic</span>
            </div>
            <div className="px-2.5 py-1 bg-cyan-900/20 border border-cyan-900/40 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">RAV4</span>
            </div>
            <div className="px-2.5 py-1 bg-cyan-900/20 border border-cyan-900/40 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">CX-9</span>
            </div>
            <button onClick={() => router.push('/')} className="w-6 h-6 rounded border border-dashed border-[#262420] flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition-all text-sm">+</button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Add Vehicle
        </button>
        <button onClick={handleExportCSV} className="bg-[#141311] border border-[#262420] text-gray-400 hover:text-white hover:border-gray-600 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
          Export Matrix
        </button>
      </div>
    </div>
  );
};

const Gauge = ({ value, dashoffset, color, textColor }: { value: number; dashoffset: number; color: string; textColor: string }) => {
  return (
    <div style={customStyles.gaugeContainer} className="flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-900"></circle>
        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={dashoffset} className={color}></circle>
      </svg>
      <span className={`absolute text-2xl font-black ${textColor}`}>{value}</span>
    </div>
  );
};

const CivicColumn = () => {
  return (
    <div style={{ ...customStyles.vehicleCol, ...customStyles.winnerGlow, backgroundColor: 'rgba(6, 78, 59, 0.05)' }} className="relative">
      <div className="h-44 border-b border-emerald-900/30 p-8 flex flex-col justify-end">
        <div className="absolute top-6 left-8 flex items-center gap-2">
          <span className="bg-emerald-500 text-[#0a0905] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Primary Winner</span>
          <svg className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white leading-none">2019 Honda Civic Sport</h2>
        <span className="font-mono text-[10px] text-emerald-500 mt-2">ID: VA-9023-CS // COMPACT</span>
      </div>

      <div className="p-8 space-y-0">
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="flex items-center gap-6">
            <Gauge value={87} dashoffset={32.6} color="text-emerald-500" textColor="text-white" />
            <div className="text-left">
              <div className="text-emerald-500 font-black text-sm uppercase tracking-tighter">+18.4%</div>
              <div className="text-[9px] text-gray-500 font-bold uppercase">vs. Market Average</div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span style={{ ...tierBadgeBase, backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }}>Uber X</span>
              <span className="text-xs font-black text-cyan-400">1.0x</span>
            </div>
            <span className="text-[9px] text-gray-500 font-medium">Standard liability entry point. No premium surcharge.</span>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div>
              <div className="text-[9px] text-gray-500 font-black uppercase mb-1">Asking Price</div>
              <div className="text-lg font-bold text-gray-400 line-through decoration-red-500/50 decoration-2">$18,500</div>
            </div>
            <div>
              <div className="text-[9px] text-emerald-400 font-black uppercase mb-1">Est. Negotiated</div>
              <div className="text-xl font-black text-white">$16,200</div>
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">-$2,300 (12%)</div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-500">+$2,950</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Equity Surplus</span>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Liability Only</span>
              <span className="text-xs font-black text-white">$142/mo</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-950/20 px-4 py-2 rounded-lg border border-cyan-800/30">
              <span className="text-[10px] font-bold text-cyan-400 uppercase">+ Rideshare Ext.</span>
              <span className="text-xs font-black text-cyan-400">$38/mo</span>
            </div>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">42,000 MILES</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase">HIGH RUNWAY</span>
            </div>
            <div className="relative w-full h-2 bg-gray-900 rounded-full overflow-visible">
              <div className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full" style={{ width: '33%', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}></div>
              <div style={{ ...customStyles.cliffMarker, left: '80%' }}>
                <span style={{ ...customStyles.cliffLabel, color: '#eab308' }}>100K</span>
              </div>
              <div style={{ ...customStyles.cliffMarker, left: '95%' }}>
                <span style={{ ...customStyles.cliffLabel, color: '#ef4444' }}>125K</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xl font-black text-white">$240</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">(Filters/Fluid Only)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RAV4Column = () => {
  return (
    <div style={customStyles.vehicleCol} className="bg-transparent">
      <div className="h-44 border-b border-[#262420] p-8 flex flex-col justify-end">
        <h2 className="text-2xl font-black text-white leading-none">2019 Toyota RAV4 Hybrid</h2>
        <span className="font-mono text-[10px] text-gray-500 mt-2">ID: VA-1108-TR // SUV</span>
      </div>

      <div className="p-8 space-y-0">
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="flex items-center gap-6">
            <Gauge value={74} dashoffset={65.3} color="text-gray-600" textColor="text-gray-400" />
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span style={{ ...tierBadgeBase, backgroundColor: 'rgba(8, 51, 68, 0.4)', color: '#22d3ee', border: '1px solid rgba(14, 116, 144, 0.5)' }}>Comfort</span>
              <span className="text-xs font-black text-cyan-400">1.2x</span>
            </div>
            <span className="text-[9px] text-gray-500 font-medium">Premium tier eligibility. Higher earnings per mile.</span>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div>
              <div className="text-[9px] text-gray-500 font-black uppercase mb-1">Asking Price</div>
              <div className="text-lg font-bold text-gray-400 line-through decoration-red-500/50 decoration-2">$24,200</div>
            </div>
            <div>
              <div className="text-[9px] text-emerald-400 font-black uppercase mb-1">Est. Negotiated</div>
              <div className="text-xl font-black text-white">$22,800</div>
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">-$1,400 (6%)</div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-500">+$1,450</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Equity Surplus</span>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Liability Only</span>
              <span className="text-xs font-black text-white">$168/mo</span>
            </div>
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">+ Rideshare Ext.</span>
              <span className="text-xs font-black text-white">$45/mo</span>
            </div>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">102,400 MILES</span>
              <span className="text-[10px] font-black text-yellow-500 uppercase">WARNING ZONE</span>
            </div>
            <div className="relative w-full h-2 bg-gray-900 rounded-full">
              <div className="absolute left-0 top-0 h-full bg-yellow-500 rounded-full" style={{ width: '82%', boxShadow: '0 0 10px rgba(234,179,8,0.4)' }}></div>
              <div style={{ ...customStyles.cliffMarker, left: '80%' }}></div>
              <div style={{ ...customStyles.cliffMarker, left: '95%' }}></div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xl font-black text-white">$850</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">(Tires/Brake Service)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CX9Column = () => {
  return (
    <div style={customStyles.vehicleColLast} className="bg-transparent">
      <div className="h-44 border-b border-[#262420] p-8 flex flex-col justify-end">
        <h2 className="text-2xl font-black text-white leading-none">2018 Mazda CX-9 XL</h2>
        <span className="font-mono text-[10px] text-gray-500 mt-2">ID: VA-4421-MC // L-SUV</span>
      </div>

      <div className="p-8 space-y-0">
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="flex items-center gap-6">
            <Gauge value={68} dashoffset={80.4} color="text-gray-800" textColor="text-gray-500" />
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span style={{ ...tierBadgeBase, backgroundColor: 'rgba(6, 78, 59, 0.4)', color: '#34d399', border: '1px solid rgba(6, 95, 70, 0.5)' }}>Uber XL</span>
              <span className="text-xs font-black text-emerald-400">1.5x</span>
            </div>
            <span className="text-[9px] text-gray-500 font-medium">Large capacity tier. Maximum earning potential.</span>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div>
              <div className="text-[9px] text-gray-500 font-black uppercase mb-1">Asking Price</div>
              <div className="text-lg font-bold text-gray-400 line-through decoration-red-500/50 decoration-2">$21,800</div>
            </div>
            <div>
              <div className="text-[9px] text-emerald-400 font-black uppercase mb-1">Est. Negotiated</div>
              <div className="text-xl font-black text-white">$21,100</div>
              <div className="text-[10px] font-black text-red-400 uppercase tracking-tighter">-$700 (3%)</div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">+$820</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Equity Surplus</span>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Liability Only</span>
              <span className="text-xs font-black text-white">$212/mo</span>
            </div>
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">+ Rideshare Ext.</span>
              <span className="text-xs font-black text-white">$62/mo</span>
            </div>
          </div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">128,100 MILES</span>
              <span className="text-[10px] font-black text-red-500 uppercase">CRITICAL CLIFF</span>
            </div>
            <div className="relative w-full h-2 bg-gray-900 rounded-full">
              <div className="absolute left-0 top-0 h-full bg-red-600 rounded-full" style={{ width: '97%', boxShadow: '0 0 10px rgba(220,38,38,0.4)' }}></div>
              <div style={{ ...customStyles.cliffMarker, left: '80%' }}></div>
              <div style={{ ...customStyles.cliffMarker, left: '95%' }}></div>
            </div>
          </div>
        </div>

        <div className="h-28 flex items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xl font-black text-red-500">$2,450</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">CRITICAL WARNING</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium mt-1">Immediate timing belt &amp; transmission service req.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricLabelCol = () => {
  return (
    <div style={customStyles.metricLabelCol} className="bg-[#0d0c0a]">
      <div className="h-44 border-b border-[#262420] p-8 flex flex-col justify-end">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selection ID / Metadata</span>
      </div>
      <div className="p-8 space-y-0">
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">I-Score Performance</span>
        </div>
        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Rideshare Tier</span>
        </div>
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Pricing Dynamics</span>
        </div>
        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Instant Equity (LTV)</span>
        </div>
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Insurance Estimates</span>
        </div>
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Life Projection</span>
        </div>
        <div className="h-28 flex items-center">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Pre-Flight Repair Cost</span>
        </div>
      </div>
    </div>
  );
};

const SummaryCards = () => {
  return (
    <div className="grid grid-cols-4 gap-8">
      <div style={customStyles.glassCard} className="p-8 rounded-3xl relative overflow-hidden group">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Predicted Net Yield</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">$4.2k</span>
          <span className="text-emerald-500 font-bold text-sm">/MO</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed uppercase font-black">Aggregated portfolio yield based on current tier selection.</p>
        <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>

      <div style={customStyles.glassCard} className="p-8 rounded-3xl relative overflow-hidden group">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Payback Velocity</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">16.4</span>
          <span className="text-cyan-500 font-bold text-sm uppercase">MONTHS</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed uppercase font-black">Estimated duration to recover initial acquisition costs.</p>
        <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
      </div>

      <div style={customStyles.glassCard} className="p-8 rounded-3xl relative overflow-hidden group">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Mechanical Exposure</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-rose-500">High</span>
          <span className="text-rose-500/50 font-black text-xs uppercase ml-2">Alert Level</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed uppercase font-black">Portion of fleet operating within 5k miles of major cliff.</p>
        <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
      </div>

      <div style={{ ...customStyles.glassCard, borderColor: 'rgba(6, 78, 59, 0.3)', backgroundColor: 'rgba(6, 78, 59, 0.05)' }} className="p-8 rounded-3xl relative overflow-hidden group">
        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Decision Confidence</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">94%</span>
          <span className="text-emerald-500 font-black text-xl">↑</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed uppercase font-black">Statistical reliability of analysis based on asset data density.</p>
        <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>
    </div>
  );
};

const Footer = ({ onSaveScenario, onExecuteAcquisition }: { onSaveScenario: () => void; onExecuteAcquisition: () => void }) => {
  return (
    <footer className="flex items-center justify-between pt-10 pb-20 border-t border-[#262420]">
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Optimal Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Standard Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">High Risk Acquisition</span>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onSaveScenario}
          className="bg-[#141311] border border-[#262420] text-gray-300 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-gray-800"
        >
          Save Scenario
        </button>
        <button
          onClick={onExecuteAcquisition}
          className="bg-emerald-600 text-[#0a0905] px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-emerald-500 shadow-xl shadow-emerald-900/20"
        >
          Execute Acquisition
        </button>
      </div>
    </footer>
  );
};

const SaveScenarioModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [scenarioName, setScenarioName] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (scenarioName.trim()) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setScenarioName('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div style={customStyles.glassCard} className="rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Save Scenario</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="mb-4">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Scenario Name</label>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g. Fleet Q3 2024 Analysis"
            className="w-full bg-[#141311] border border-[#262420] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-700"
          />
        </div>
        {saved ? (
          <div className="bg-emerald-900/20 border border-emerald-900/40 rounded-lg px-4 py-3 text-emerald-400 text-xs font-black uppercase tracking-widest text-center">
            ✓ Scenario Saved Successfully
          </div>
        ) : (
          <button
            onClick={handleSave}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
          >
            Save Scenario
          </button>
        )}
      </div>
    </div>
  );
};

const ExecuteModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div style={customStyles.glassCard} className="rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Execute Acquisition</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500 text-[#0a0905] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Primary Winner</span>
          </div>
          <div className="text-white font-black text-lg">2019 Honda Civic Sport</div>
          <div className="text-emerald-500 font-mono text-[10px] mt-1">ID: VA-9023-CS // $16,200 Negotiated</div>
        </div>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6 leading-relaxed">
          Confirm acquisition of primary winner asset. This will initiate the purchase workflow.
        </p>
        {confirmed ? (
          <div className="bg-emerald-900/20 border border-emerald-900/40 rounded-lg px-4 py-3 text-emerald-400 text-xs font-black uppercase tracking-widest text-center">
            ✓ Acquisition Initiated — Workflow Started
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-[#141311] border border-[#262420] text-gray-300 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-emerald-600 text-[#0a0905] py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ComparisonVehicleColumn = ({ vehicle, index, isLast, isWinner }: { vehicle: any; index: number; isLast: boolean; isWinner: boolean }) => {
  const v = vehicle;
  const score = v.score || 50;
  const dashoffset = 251.2 - (251.2 * score / 100);
  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-yellow-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const name = v.name || `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim();
  const price = v.price ? `$${Number(v.price).toLocaleString()}` : '—';
  const negotiated = v.negotiated || '—';
  const equity = v.equity || '—';
  const insurance = v.insurance || '—';
  const opex = v.opex || '—';
  const miles = v.mileage ? `${Number(v.mileage).toLocaleString()} miles` : (v.miles || '—');
  const bodyStyle = v.bodyStyle || '—';

  return (
    <div style={{ ...customStyles.vehicleCol, ...(isLast ? customStyles.vehicleColLast : {}), ...(isWinner ? { ...customStyles.winnerGlow, backgroundColor: 'rgba(6, 78, 59, 0.05)' } : {}) }} className="relative">
      <div className="h-44 border-b border-[#262420] p-8 flex flex-col justify-end">
        {isWinner && (
          <div className="absolute top-6 left-8 flex items-center gap-2">
            <span className="bg-emerald-500 text-[#0a0905] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Primary Winner</span>
            <svg className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z"></path></svg>
          </div>
        )}
        <h2 className="text-2xl font-black text-white leading-none truncate" title={name}>{name}</h2>
        <span className="font-mono text-[10px] text-gray-500 mt-2">{bodyStyle} • {miles}</span>
      </div>

      <div className="p-8 space-y-0">
        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="flex items-center gap-6">
            <Gauge value={score} dashoffset={dashoffset} color={scoreColor} textColor="text-white" />
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex flex-col gap-2"><span className="text-xs font-black text-gray-400">{bodyStyle || 'Standard'}</span></div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div><div className="text-[9px] text-gray-500 font-black uppercase mb-1">Asking Price</div><div className="text-lg font-bold text-gray-400 line-through decoration-red-500/50 decoration-2">{price}</div></div>
            <div><div className="text-[9px] text-emerald-400 font-black uppercase mb-1">Est. Negotiated</div><div className="text-xl font-black text-white">{negotiated}</div></div>
          </div>
        </div>

        <div className="h-28 flex items-center border-b border-[#262420]/50">
          <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-emerald-500">{equity}</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Equity</span></div>
        </div>

        <div className="h-32 flex items-center border-b border-[#262420]/50">
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]"><span className="text-[10px] font-bold text-gray-400 uppercase">Insurance</span><span className="text-xs font-black text-red-400">{insurance}/mo</span></div>
            <div className="flex justify-between items-center bg-[#141311] px-4 py-2 rounded-lg border border-[#262420]"><span className="text-[10px] font-bold text-gray-400 uppercase">OpEx</span><span className="text-xs font-black text-red-400">{opex}/mo</span></div>
          </div>
        </div>

        <div className="h-28 flex items-center">
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-lg font-black text-white">{miles}</span></div>
        </div>
      </div>
    </div>
  );
};

const MatrixPage = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [engineMode, setEngineMode] = useState('3up');
  const [comparisonVehicles, setComparisonVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Read selected IDs from KV/localStorage
        const { kvGet } = await import('@/lib/kv-client');
        const ids = await kvGet<string[]>('vera_comparison_ids') || [];
        
        if (ids.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch fleet and filter by selected IDs
        const res = await fetch('/api/fleet');
        if (res.ok) {
          const fleet = await res.json();
          const selected = fleet.filter((v: any) => ids.includes(String(v.id)));
          setComparisonVehicles(selected);
        }
      } catch (e) {
        console.error('Failed to load comparison vehicles:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const displayVehicles = comparisonVehicles.length > 0 ? comparisonVehicles : null;

  return (
    <>
      <SubHeader engineMode={engineMode} setEngineMode={setEngineMode} />
      <main className="flex-1 p-10 space-y-10">
        <div className="flex items-baseline gap-4 mb-4">
          <h1 className="text-4xl font-black text-white tracking-tight">Multi-Attribute Utility Analysis</h1>
          <span className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">Comparison Engine V.2.1</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-800 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
        ) : displayVehicles ? (
          <section style={{ ...customStyles.glassCard, borderRadius: '2.5rem', overflow: 'hidden', display: 'flex', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <MetricLabelCol />
            {displayVehicles.map((v, i) => (
              <ComparisonVehicleColumn key={v.id} vehicle={v} index={i} isLast={i === displayVehicles.length - 1} isWinner={i === 0} />
            ))}
          </section>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-[#11100e] border border-[#262420] rounded-2xl">
            <p className="text-gray-400 font-bold text-lg mb-2">No Vehicles Selected</p>
            <p className="text-gray-600 text-sm">Select vehicles from the Fleet Dashboard and click Compare.</p>
            <Link href="/fleet" className="mt-4 bg-cyan-600 text-white px-6 py-2 rounded-lg text-sm font-bold">Go to Fleet</Link>
          </div>
        )}

        <SummaryCards />
        <Footer
          onSaveScenario={() => setSaveModalOpen(true)}
          onExecuteAcquisition={() => setExecuteModalOpen(true)}
        />
      </main>
      <SaveScenarioModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} />
      <ExecuteModal isOpen={executeModalOpen} onClose={() => setExecuteModalOpen(false)} />
    </>
  );
};

const App = () => {
  const [activeNav, setActiveNav] = useState('matrix');

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0905';
    document.body.style.color = '#d1d5db';
    document.body.style.fontFamily = "'Inter', sans-serif";
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #0a0905; }
      ::-webkit-scrollbar-thumb { background: #262420; border-radius: 10px; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#0a0905', color: '#d1d5db', fontFamily: "'Inter', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeNav={activeNav} setActiveNav={setActiveNav} />
      <MatrixPage />
    </div>
  );
};

export default App;