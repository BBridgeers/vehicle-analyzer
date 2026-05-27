"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const scrollbarStyles = `
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #0a0905; }
  ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #3a3835; }
  html { scroll-behavior: smooth; }
`;

const CircleScore = ({ score, colorClass }: { score: number; colorClass: string }) => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 36 36">
      <path
        className="text-[#2a2825]"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke="currentColor" strokeWidth="3"
      />
      <path
        className={colorClass}
        strokeDasharray={`${score}, 100`}
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke="currentColor" strokeWidth="3"
      />
    </svg>
    <span className="text-xs font-black text-white">{score}</span>
  </div>
);

const CheckboxControl = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <label className="flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-cyan-600 border-cyan-600' : 'border-[#3a3730] bg-[#0a0905]'}`}>
      <svg className={`w-3 h-3 text-white ${checked ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  </label>
);

const VehicleCard = ({ vehicle, checked, onToggle, onDelete }: { vehicle: any; checked: boolean; onToggle: () => void; onDelete: (e: React.MouseEvent) => void }) => {
  // Handle both analyzed vehicles (with score/badge) and raw scraped vehicles
  const isAnalyzed = typeof vehicle.score === 'number' && vehicle.score > 0;
  const displayScore = isAnalyzed ? vehicle.score : (vehicle.price ? Math.min(95, Math.round(vehicle.price / 200)) : 50);
  const displayBadge = isAnalyzed ? vehicle.badge : (vehicle.status === 'pending_analysis' ? 'Pending Analysis' : 'Raw Listing');
  const displayBadgeClass = isAnalyzed ? vehicle.badgeClass : 'bg-gray-600 text-white';
  const displayScoreColor = isAnalyzed ? vehicle.scoreColor : 'text-gray-500';
  const displayLocation = vehicle.location && vehicle.location !== 'Unknown' ? vehicle.location : '';
  const displayMiles = vehicle.miles ? `${Number(vehicle.miles).toLocaleString()} miles` : (vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} miles` : '');
  const displayName = vehicle.name || [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') || 'Unknown Vehicle';
  const displayPrice = vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : '';

  return (
  <div
    className="bg-[#11100e] border border-[#262420] rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all group cursor-pointer relative"
    onClick={onToggle}
  >
    {/* Thumbnail — first image from scraper */}
    {vehicle.images && vehicle.images.length > 0 && (
      <div className="w-full h-40 bg-[#0a0905] overflow-hidden">
        <img
          src={vehicle.images[0]}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    )}
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
      <CheckboxControl checked={checked} onChange={onToggle} />
    </div>
    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={onDelete}
        className="p-1.5 bg-red-950/30 text-red-500 hover:bg-red-900/50 rounded-md border border-red-900/30 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
    <div className="p-5 border-b border-[#262420] relative">
      <div className="flex justify-between items-start mb-4 pl-8">
        <div>
          <h3 className="font-bold text-gray-100 text-lg">{displayName}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {[displayPrice, displayMiles, displayLocation].filter(Boolean).join(' • ')}
          </p>
        </div>
        <CircleScore score={displayScore} colorClass={displayScoreColor} />
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 font-black tracking-widest uppercase text-[10px] rounded ${displayBadgeClass}`}>
          {displayBadge}
        </span>
      </div>
    </div>
    <div className="p-4 bg-[#141311] space-y-3">
      {/* Asking → Negotiated (the money line) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Asking</p>
          <p className="text-base font-bold text-gray-100">{displayPrice || '—'}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Negotiate To</p>
          <p className="text-base font-bold text-cyan-400">{vehicle.negotiated || '—'}</p>
        </div>
      </div>
      {/* Insurance, OpEx, Equity (tiny) */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Ins /mo</p>
          <p className="text-sm font-bold text-gray-200">{vehicle.insurance || '—'}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">OpEx /mo</p>
          <p className="text-sm font-bold text-gray-200">{vehicle.opex || '—'}</p>
        </div>
        <div>
          <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">Equity</p>
          <p className={`text-xs font-bold ${vehicle.equityColor || 'text-gray-500'}`}>{vehicle.equity || '—'}</p>
        </div>
      </div>
    </div>
  </div>
)};

const AddCard = () => (
  <div className="bg-[#11100e] border border-[#262420] border-dashed rounded-xl flex flex-col items-center justify-center p-8 group hover:bg-[#1a1816] hover:border-cyan-500/30 transition-all cursor-pointer">
    <div className="w-12 h-12 rounded-full bg-[#1e1c19] border border-[#262420] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
      </svg>
    </div>
    <p className="text-sm font-bold text-gray-400">Add Evaluation</p>
    <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Expand Fleet Capacity</p>
  </div>
);

const initialVehicles = [
  {
    id: 1,
    name: '2019 Honda Civic Sport',
    miles: '38,900 miles',
    location: 'Austin, TX',
    score: 87,
    scoreColor: 'text-emerald-500',
    badge: 'Strong Buy',
    badgeClass: 'bg-emerald-500 text-[#0a0905]',
    equity: '+$2,950',
    equityColor: 'text-emerald-400',
    opex: '$484',
  },
  {
    id: 2,
    name: '2021 Tesla Model 3',
    miles: '12,400 miles',
    location: 'Phoenix, AZ',
    score: 72,
    scoreColor: 'text-cyan-500',
    badge: 'Fair Deal',
    badgeClass: 'bg-cyan-600 text-white',
    equity: '+$1,120',
    equityColor: 'text-cyan-400',
    opex: '$312',
  },
  {
    id: 3,
    name: '2018 Toyota Camry XLE',
    miles: '54,000 miles',
    location: 'Dallas, TX',
    score: 91,
    scoreColor: 'text-green-500',
    badge: 'Excellent',
    badgeClass: 'bg-green-600 text-white',
    equity: '+$4,200',
    equityColor: 'text-emerald-400',
    opex: '$525',
  },
  {
    id: 4,
    name: '2020 Ford Fusion Hybrid',
    miles: '42,100 miles',
    location: 'Houston, TX',
    score: 64,
    scoreColor: 'text-amber-500',
    badge: 'Moderate Buy',
    badgeClass: 'bg-amber-500 text-[#0a0905]',
    equity: '+$850',
    equityColor: 'text-gray-300',
    opex: '$442',
  },
  {
    id: 5,
    name: '2017 Honda Accord Sport',
    miles: '62,000 miles',
    location: 'San Antonio, TX',
    score: 82,
    scoreColor: 'text-emerald-500',
    badge: 'Strong Buy',
    badgeClass: 'bg-emerald-500 text-[#0a0905]',
    equity: '+$2,100',
    equityColor: 'text-emerald-400',
    opex: '$498',
  },
];

import { useRouter } from 'next/navigation';

const FleetDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Active');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/fleet');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this evaluation?')) return;
    
    try {
      await fetch('/api/fleet', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const clearSelection = () => setSelected({});

  const handleCompare = () => {
    const selectedIds = Object.keys(selected).filter(id => selected[Number(id)]);
    (async () => {
      const { kvSet } = await import('@/lib/kv-client');
      await kvSet('vera_comparison_ids', selectedIds);
    })();
    router.push('/comparison');
  };

  return (
    <div className="bg-[#0a0905] text-gray-200 h-screen w-full flex overflow-hidden font-sans" style={{ fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#11100e] border-r border-[#262420] flex flex-col h-full z-10 flex-shrink-0 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-[#262420]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white tracking-widest text-sm">VA</div>
            <span className="font-bold text-lg tracking-wider text-gray-100">V.E.R.A.</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 border-b border-[#262420]">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Evaluation
          </Link>
          <Link href="/fleet" className="w-full flex items-center gap-3 px-3 py-2 bg-cyan-950/30 text-cyan-400 rounded-md text-sm font-medium transition-colors border border-cyan-900/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Fleet Dashboard
          </Link>
          <Link href="/comparison" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Comparison Matrix
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Market Analytics
          </Link>
        </nav>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Analysis History</h3>
          <div className="space-y-3">
            {vehicles.slice(0, 3).map(v => (
              <div key={v.id}
                onClick={() => router.push(`/?vin=${v.vin || ''}`)}
                className="p-3 bg-[#11100e] border border-[#262420] rounded-lg cursor-pointer hover:border-[#3a3730] transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-300 truncate pr-2">{v.name}</span>
                  <span className={`text-[10px] ${v.scoreColor} bg-white/5 px-1.5 py-0.5 rounded font-black`}>{v.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#262420] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-100 font-bold text-sm">JS</div>
          <div className="flex-1">
            <div className="text-sm font-medium">J. Smith</div>
            <div className="text-xs text-gray-500">Pro Analyst</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full bg-[#0a0905] overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#262420] flex-shrink-0 bg-[#0a0905]/90 backdrop-blur z-30">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-100">Fleet Dashboard</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Monitoring {vehicles.length} Units</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <div className="flex items-center gap-3 bg-cyan-950/30 border border-cyan-800/50 rounded-lg px-3 py-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-xs text-cyan-400 font-medium">{selectedCount} selected</span>
                <button 
                  onClick={handleCompare}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-900/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare
                </button>
                <button onClick={clearSelection} className="text-gray-500 hover:text-gray-300 text-xs px-2">Clear</button>
              </div>
            )}
            <div className="flex bg-[#11100e] border border-[#262420] p-1 rounded-lg">
              {['Active', 'Watching', 'Passed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Link href="/" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-800 border-t-cyan-400 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium tracking-wide">Syncing with Cloud Intelligence...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-6">
              <div className="p-6 bg-[#11100e] border border-[#262420] rounded-2xl flex flex-col items-center text-center max-w-sm">
                <div className="w-16 h-16 bg-cyan-950/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-200">No Fleet Units Detected</h3>
                <p className="text-sm text-gray-500 mt-2">Start by capturing a listing or decoding a VIN to build your evaluation matrix.</p>
                <Link href="/" className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-cyan-900/20">
                  Begin First Scan
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vehicles.map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  checked={!!selected[vehicle.id]}
                  onToggle={() => toggleSelect(vehicle.id)}
                  onDelete={(e) => handleDelete(vehicle.id, e)}
                />
              ))}
              <Link href="/">
                <AddCard />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = scrollbarStyles;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <FleetDashboard />
  );
};

export default App;