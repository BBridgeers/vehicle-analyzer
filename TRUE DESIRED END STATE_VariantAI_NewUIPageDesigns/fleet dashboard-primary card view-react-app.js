import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const scrollbarStyles = `
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #0a0905; }
  ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #3a3835; }
  html { scroll-behavior: smooth; }
`;

const CircleScore = ({ score, colorClass }) => (
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

const CheckboxControl = ({ checked, onChange }) => (
  <label className="flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-cyan-600 border-cyan-600' : 'border-[#3a3730] bg-[#0a0905]'}`}>
      <svg className={`w-3 h-3 text-white ${checked ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  </label>
);

const VehicleCard = ({ vehicle, checked, onToggle }) => (
  <div
    className="bg-[#11100e] border border-[#262420] rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all group cursor-pointer relative"
    onClick={onToggle}
  >
    <div className="absolute top-3 left-3 z-10">
      <CheckboxControl checked={checked} onChange={onToggle} />
    </div>
    <div className="p-5 border-b border-[#262420] relative">
      <div className="flex justify-between items-start mb-4 pl-8">
        <div>
          <h3 className="font-bold text-gray-100 text-lg">{vehicle.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{vehicle.miles} • {vehicle.location}</p>
        </div>
        <CircleScore score={vehicle.score} colorClass={vehicle.scoreColor} />
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 font-black tracking-widest uppercase text-[10px] rounded ${vehicle.badgeClass}`}>
          {vehicle.badge}
        </span>
      </div>
    </div>
    <div className="p-5 grid grid-cols-2 gap-4 bg-[#141311]">
      <div>
        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Equity</p>
        <p className={`text-lg font-bold ${vehicle.equityColor}`}>{vehicle.equity}</p>
      </div>
      <div>
        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Monthly OpEx</p>
        <p className="text-lg font-bold text-gray-200">{vehicle.opex}</p>
      </div>
    </div>
  </div>
);

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

const FleetDashboard = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [selected, setSelected] = useState({ 1: true, 2: true });

  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const clearSelection = () => setSelected({});

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
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Evaluation
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-cyan-950/30 text-cyan-400 rounded-md text-sm font-medium transition-colors border border-cyan-900/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Fleet Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Comparison Matrix
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Analytics
          </a>
        </nav>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Analysis History</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[#11100e] border border-[#262420] rounded-lg cursor-pointer hover:border-[#3a3730] transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-gray-300">2019 Honda Civic</span>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Strong</span>
              </div>
            </div>
            <div className="p-3 bg-[#11100e] border border-[#262420] rounded-lg cursor-pointer hover:border-[#3a3730] transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-gray-300">2019 Toyota RAV4</span>
                <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Good</span>
              </div>
            </div>
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
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Monitoring 14 Active Units</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <div className="flex items-center gap-3 bg-cyan-950/30 border border-cyan-800/50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-cyan-400 font-medium">{selectedCount} selected</span>
                <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5">
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
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {initialVehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                checked={!!selected[vehicle.id]}
                onToggle={() => toggleSelect(vehicle.id)}
              />
            ))}
            <AddCard />
          </div>
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
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<FleetDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;