"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const customStyles = {
  scrollbar: `
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #0a0905; }
    ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3a3835; }
    select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      background-size: 1.25rem 1.25rem;
    }
    .sticky-col {
      position: sticky;
      left: 0;
      background-color: #161513;
      z-index: 10;
    }
    .sticky-col::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      background-color: #2a2825;
    }
  `
};

const vehicles = [
  {
    id: 1,
    name: '2019 Honda Civic',
    sub: 'Sport Sedan 4D',
    topColor: 'bg-green-500',
    bgCard: 'bg-[#161513]',
    borderCard: 'border-[#3a3730]',
    verdictBg: 'bg-green-900/20',
    verdictBorder: 'border-green-800/50',
    verdictDot: 'bg-green-500',
    verdictDotAnimate: false,
    verdictLabel: 'Recommended',
    verdictLabelColor: 'text-green-400',
    verdictScore: 87,
    verdictScoreColor: 'text-green-200',
    verdictScoreBorder: 'border-green-800/50',
    price: '$18,500',
    marketValue: '$19,200',
    equity: '+$700',
    equityColor: 'text-green-400',
    mileage: '65,000 mi',
    title: 'Clean',
    titleBg: 'bg-gray-800 text-gray-300',
    issues: <span className="text-green-400 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> None Detected</span>,
    rideshare: [
      <span key="u" className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-xs">UberX</span>,
      <span key="l" className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-xs">Lyft</span>
    ],
    monthlyNet: '$1,450',
    monthlyNetColor: 'text-gray-200',
    monthlyExtra: null,
    payback: '12.8 months',
    paybackColor: 'text-gray-200',
    sellerDot: 'bg-green-500',
    sellerType: 'Responsive Private',
    sellerLoc: 'Austin, TX • Listed 2d ago',
    isAvoid: false,
    rowBg: '',
    actionBtns: 'standard',
  },
  {
    id: 2,
    name: '2018 Toyota Camry',
    sub: 'SE Sedan 4D',
    topColor: 'bg-emerald-400',
    bgCard: 'bg-[#161513]',
    borderCard: 'border-[#3a3730]',
    verdictBg: 'bg-emerald-900/30',
    verdictBorder: 'border-emerald-500/30',
    verdictDot: 'bg-emerald-400',
    verdictDotAnimate: true,
    verdictLabel: 'Strong Buy',
    verdictLabelColor: 'text-emerald-400',
    verdictScore: 92,
    verdictScoreColor: 'text-emerald-200',
    verdictScoreBorder: 'border-emerald-800/50',
    price: '$16,200',
    marketValue: '$18,500',
    equity: '+$2,300',
    equityColor: 'text-emerald-400',
    mileage: '82,400 mi',
    title: 'Clean',
    titleBg: 'bg-gray-800 text-gray-300',
    issues: <span>1 <span className="text-yellow-400">Low</span> (Cosmetic)</span>,
    rideshare: [
      <span key="u" className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-xs">UberX</span>,
      <span key="c" className="bg-purple-900/30 text-purple-400 border border-purple-800 px-2 py-0.5 rounded text-xs">Comfort</span>
    ],
    monthlyNet: '$1,680',
    monthlyNetColor: 'text-green-400',
    monthlyExtra: '(Comfort bonus)',
    payback: '9.6 months',
    paybackColor: 'text-green-400 font-medium',
    sellerDot: 'bg-yellow-500',
    sellerType: 'Small Dealer',
    sellerLoc: 'Dallas, TX • Listed 14d ago',
    isAvoid: false,
    rowBg: '',
    actionBtns: 'standard',
  },
  {
    id: 3,
    name: '2017 Mazda3',
    sub: 'Touring Hatchback',
    topColor: 'bg-amber-400',
    bgCard: 'bg-[#161513]',
    borderCard: 'border-[#3a3730]',
    verdictBg: 'bg-amber-900/20',
    verdictBorder: 'border-amber-800/50',
    verdictDot: 'bg-amber-500',
    verdictDotAnimate: false,
    verdictLabel: 'Caution',
    verdictLabelColor: 'text-amber-400',
    verdictScore: 74,
    verdictScoreColor: 'text-amber-200',
    verdictScoreBorder: 'border-amber-800/50',
    price: '$14,800',
    marketValue: '$14,500',
    equity: '-$300',
    equityColor: 'text-red-400',
    mileage: '95,100 mi',
    title: 'Rebuilt',
    titleBg: 'bg-orange-900/40 text-orange-400 border border-orange-800',
    issues: <span>2 <span className="text-orange-400">Medium</span> (Tires, AC)</span>,
    rideshare: [
      <span key="d" className="bg-red-900/20 text-red-400 border border-red-800/50 px-2 py-0.5 rounded text-xs">Disqualified (Title)</span>
    ],
    monthlyNet: '--',
    monthlyNetColor: 'text-gray-500',
    monthlyExtra: null,
    payback: 'N/A',
    paybackColor: 'text-gray-500',
    sellerDot: 'bg-red-500',
    sellerType: 'Suspected Flipper',
    sellerLoc: 'Houston, TX • Listed 5d ago',
    isAvoid: false,
    rowBg: '',
    actionBtns: 'standard',
  },
  {
    id: 4,
    name: '2020 Hyundai Elantra',
    sub: 'SEL Sedan 4D',
    topColor: 'bg-red-500',
    bgCard: 'bg-[#1a1313]',
    borderCard: 'border-red-900/30',
    verdictBg: 'bg-red-900/30',
    verdictBorder: 'border-red-800/50',
    verdictDot: null,
    verdictDotAnimate: false,
    verdictLabel: 'Avoid',
    verdictLabelColor: 'text-red-400',
    verdictScore: 61,
    verdictScoreColor: 'text-red-200',
    verdictScoreBorder: 'border-red-800/50',
    price: '$17,900',
    marketValue: '$16,000',
    equity: '-$1,900',
    equityColor: 'text-red-500',
    mileage: '45,200 mi',
    title: 'Clean',
    titleBg: 'bg-gray-800 text-gray-300',
    issues: <span><span className="text-red-400 font-medium">1 Critical</span> (Trans slip), 1 Med</span>,
    rideshare: [
      <span key="u" className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-xs">UberX</span>
    ],
    monthlyNet: '$1,350',
    monthlyNetColor: 'text-gray-200',
    monthlyExtra: null,
    payback: '13.2 months',
    paybackColor: 'text-gray-200',
    sellerDot: 'bg-yellow-500',
    sellerType: 'Slow to Reply',
    sellerLoc: 'San Antonio, TX • Listed 1d ago',
    isAvoid: true,
    rowBg: 'bg-red-950/10',
    actionBtns: 'avoid',
  },
  {
    id: 5,
    name: '2019 Nissan Sentra',
    sub: 'SR Sedan 4D',
    topColor: 'bg-green-500',
    bgCard: 'bg-[#161513]',
    borderCard: 'border-[#3a3730]',
    verdictBg: 'bg-green-900/20',
    verdictBorder: 'border-green-800/50',
    verdictDot: 'bg-green-500',
    verdictDotAnimate: false,
    verdictLabel: 'Recommended',
    verdictLabelColor: 'text-green-400',
    verdictScore: 85,
    verdictScoreColor: 'text-green-200',
    verdictScoreBorder: 'border-green-800/50',
    price: '$15,500',
    marketValue: '$16,800',
    equity: '+$1,300',
    equityColor: 'text-green-400',
    mileage: '69,300 mi',
    title: 'Clean',
    titleBg: 'bg-gray-800 text-gray-300',
    issues: <span>1 <span className="text-yellow-400">Low</span> (Brakes soon)</span>,
    rideshare: [
      <span key="u" className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-xs">UberX</span>
    ],
    monthlyNet: '$1,400',
    monthlyNetColor: 'text-gray-200',
    monthlyExtra: null,
    payback: '11.0 months',
    paybackColor: 'text-gray-200',
    sellerDot: 'bg-green-500',
    sellerType: 'Responsive Private',
    sellerLoc: 'Austin, TX • Listed 8d ago',
    isAvoid: false,
    rowBg: '',
    actionBtns: 'standard',
  }
];

const Sidebar = ({ activeNav, setActiveNav }: { activeNav: string; setActiveNav: (id: string) => void }) => {
  const navItems = [
    {
      label: 'New Evaluation',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    },
    {
      label: 'Fleet Dashboard',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    },
    {
      label: 'Comparison Matrix',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    },
    {
      label: 'Market Analytics',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    },
  ];

  const savedFleets = [
    { name: 'Sedans for UberX', count: 5, updated: 'Updated Today', active: true },
    { name: 'SUVs for XL/Black', count: 3, updated: 'Last week', active: false },
    { name: 'Budget Delivery', count: 8, updated: 'Oct 15', active: false },
  ];

  return (
    <aside className="w-64 bg-[#11100e] border-r border-[#262420] flex flex-col h-full z-20 flex-shrink-0 relative">
      <div className="h-16 flex items-center px-6 border-b border-[#262420]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white tracking-widest text-sm">VA</div>
          <span className="font-bold text-lg tracking-wider text-gray-100">V.E.R.A.</span>
        </div>
      </div>

      <nav className="p-4 space-y-1 border-b border-[#262420]">
        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#1e1c19] text-cyan-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Saved Fleets</h3>
        <div className="space-y-3">
          {savedFleets.map((fleet) => (
            <div
              key={fleet.name}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                fleet.active
                  ? 'bg-[#1e1c19] border border-cyan-800'
                  : 'bg-[#11100e] border border-[#262420] hover:border-[#3a3730]'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-gray-200">{fleet.name}</span>
                {fleet.active && (
                  <span className="text-xs text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>{fleet.count} Vehicles</span>
                <span>{fleet.updated}</span>
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
  );
};

const VehicleHeader = ({ vehicle }: { vehicle: any }) => (
  <th className={`p-4 min-w-[280px] w-[280px] border-l border-b border-[#2a2825] ${vehicle.bgCard} relative`}>
    <div className={`absolute top-0 left-0 right-0 h-1 ${vehicle.topColor}`}></div>
    <div className={`h-32 bg-[#0a0905] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group border ${vehicle.borderCard}`}>
      <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
    <h3 className="text-base font-bold text-gray-100 truncate">{vehicle.name}</h3>
    <p className="text-sm text-gray-400">{vehicle.sub}</p>
  </th>
);

const VerdictCell = ({ vehicle }: { vehicle: any }) => (
  <td className={`p-4 border-l border-[#2a2825] ${vehicle.rowBg}`}>
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${vehicle.verdictBg} border ${vehicle.verdictBorder} ${vehicle.isAvoid ? '' : ''}`}
      style={vehicle.id === 2 ? { boxShadow: '0 0 10px rgba(16,185,129,0.1)' } : {}}
    >
      {vehicle.verdictDot ? (
        <span className={`w-2 h-2 rounded-full ${vehicle.verdictDot} ${vehicle.verdictDotAnimate ? 'animate-pulse' : ''}`}></span>
      ) : (
        <span className="text-red-500 font-bold">✕</span>
      )}
      <span className={`text-sm font-bold ${vehicle.verdictLabelColor} uppercase tracking-wide`}>{vehicle.verdictLabel}</span>
      <span className={`text-sm font-mono ${vehicle.verdictScoreColor} border-l ${vehicle.verdictScoreBorder} pl-2 ml-1`}>{vehicle.verdictScore}</span>
    </div>
  </td>
);

const ActionCell = ({ vehicle, onRemove }: { vehicle: any; onRemove: (id: number) => void }) => {
  if (vehicle.actionBtns === 'avoid') {
    return (
      <td className="p-4 border-l border-t border-red-900/30 bg-red-950/20">
        <div className="flex gap-2">
          <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm font-medium transition-colors border border-gray-700">Full Report</button>
          <button
            onClick={() => onRemove(vehicle.id)}
            className="flex-1 flex items-center justify-center gap-1 bg-red-900/40 hover:bg-red-800 text-red-400 rounded border border-red-800 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Drop
          </button>
        </div>
      </td>
    );
  }
  return (
    <td className="p-4 border-l border-t border-[#3a3730]">
      <div className="flex gap-2">
        <button className="flex-1 bg-cyan-900/40 hover:bg-cyan-800 text-cyan-400 py-2 rounded text-sm font-medium transition-colors border border-cyan-800">Full Report</button>
        <button
          onClick={() => onRemove(vehicle.id)}
          className="w-10 flex items-center justify-center bg-[#1a1816] hover:bg-red-900/40 text-gray-500 hover:text-red-400 rounded border border-[#2a2825] hover:border-red-800 transition-colors"
          title="Remove from comparison"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </td>
  );
};

const FleetDashboard = () => {
  const [activeVehicles, setActiveVehicles] = useState(vehicles.map(v => v.id));
  const [sortBy, setSortBy] = useState('Verdict Score (High-Low)');
  const [showAllRatings, setShowAllRatings] = useState(true);
  const [rideshareOnly, setRideshareOnly] = useState(false);

  const displayed = vehicles.filter(v => activeVehicles.includes(v.id));

  const handleRemove = (id: number) => {
    setActiveVehicles(prev => prev.filter(vid => vid !== id));
  };

  const handleClearAll = () => {
    setActiveVehicles([]);
  };

  const totalOutlay = displayed.reduce((sum, v) => {
    const price = parseInt(v.price.replace(/[$,]/g, ''));
    return sum + price;
  }, 0);

  const avgMileage = displayed.length > 0
    ? Math.round(displayed.reduce((sum, v) => {
        const miles = parseInt(v.mileage.replace(/[^0-9]/g, ''));
        return sum + miles;
      }, 0) / displayed.length)
    : 0;

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0a0905] overflow-hidden relative">
      <header className="h-16 flex items-center justify-between px-8 border-b border-[#262420] flex-shrink-0 z-20" style={{ backgroundColor: 'rgba(10,9,5,0.8)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-100">Fleet Dashboard</h1>
          <span className="text-xs font-medium text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-full border border-cyan-800">
            {displayed.length} Vehicles Selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAll}
            className="text-gray-400 hover:text-red-400 transition-colors text-sm font-medium flex items-center gap-2 px-3 py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Selection
          </button>
          <div className="w-px h-6 bg-[#2a2825]"></div>
          <button className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All Reports
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2" style={{ boxShadow: '0 0 15px rgba(8,145,178,0.3)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </header>

      <div className="px-8 py-4 border-b border-[#262420] bg-[#0f0e0b] flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#050403] border border-[#3a3730] rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 min-w-[160px]"
            >
              <option>Verdict Score (High-Low)</option>
              <option>Price (Low-High)</option>
              <option>Equity (High-Low)</option>
              <option>Payback (Fastest)</option>
            </select>
          </div>
          <div className="w-px h-6 bg-[#2a2825]"></div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showAllRatings}
                onChange={(e) => setShowAllRatings(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-cyan-600 focus:ring-cyan-600 focus:ring-offset-gray-900 bg-gray-700"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Show All Ratings</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rideshareOnly}
                onChange={(e) => setRideshareOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-cyan-600 focus:ring-cyan-600 focus:ring-offset-gray-900 bg-gray-700"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Rideshare Eligible Only</span>
            </label>
          </div>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-6">
          <span>Total Potential Outlay: <strong className="text-gray-200">${totalOutlay.toLocaleString()}</strong></span>
          <span>Avg Mileage: <strong className="text-gray-200">{displayed.length > 0 ? avgMileage.toLocaleString() : 0} mi</strong></span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0a0905]">
        <div className="p-8 pb-12 inline-block min-w-full align-middle">

          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-medium text-gray-600">No vehicles selected</p>
              <p className="text-sm mt-1">Add vehicles to compare them here.</p>
            </div>
          ) : (
            <div className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="sticky-col p-4 w-48 align-bottom border-b border-[#2a2825]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Comparison<br />Metrics</span>
                    </th>
                    {displayed.map(vehicle => (
                      <VehicleHeader key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2a2825]">
                  {/* VERA Verdict */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">VERA Verdict</td>
                    {displayed.map(vehicle => <VerdictCell key={vehicle.id} vehicle={vehicle} />)}
                  </tr>

                  {/* Asking Price */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Asking Price</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-xl font-bold text-gray-100 ${vehicle.rowBg}`}>{vehicle.price}</td>
                    ))}
                  </tr>

                  {/* Est. Market Value */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Est. Market Value</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm text-gray-300 ${vehicle.rowBg}`}>{vehicle.marketValue}</td>
                    ))}
                  </tr>

                  {/* Instant Equity */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Instant Equity</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] font-medium ${vehicle.equityColor} ${vehicle.rowBg}`}>{vehicle.equity}</td>
                    ))}
                  </tr>

                  {/* Reported Mileage */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Reported Mileage</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm text-gray-200 ${vehicle.rowBg}`}>{vehicle.mileage}</td>
                    ))}
                  </tr>

                  {/* Title Status */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Title Status</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm ${vehicle.rowBg}`}>
                        <span className={`px-2 py-1 rounded ${vehicle.titleBg}`}>{vehicle.title}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Identified Issues */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Identified Issues</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm text-gray-300 ${vehicle.rowBg}`}>{vehicle.issues}</td>
                    ))}
                  </tr>

                  {/* Rideshare Tiers */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Rideshare Tiers</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm ${vehicle.rowBg}`}>
                        <div className="flex gap-2">{vehicle.rideshare}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Est. Monthly Net */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Est. Monthly Net</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] font-medium ${vehicle.monthlyNetColor} ${vehicle.rowBg}`}>
                        {vehicle.monthlyNet}
                        {vehicle.monthlyExtra && <span className="text-xs text-gray-500 font-normal ml-1">{vehicle.monthlyExtra}</span>}
                      </td>
                    ))}
                  </tr>

                  {/* Est. Payback Period */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Est. Payback Period</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm ${vehicle.paybackColor} ${vehicle.rowBg}`}>{vehicle.payback}</td>
                    ))}
                  </tr>

                  {/* Seller Intel */}
                  <tr className="hover:bg-[#1a1816] transition-colors">
                    <td className="sticky-col p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Seller Intel</td>
                    {displayed.map(vehicle => (
                      <td key={vehicle.id} className={`p-4 border-l border-[#2a2825] text-sm ${vehicle.rowBg}`}>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className={`w-2 h-2 rounded-full ${vehicle.sellerDot}`}></span> {vehicle.sellerType}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{vehicle.sellerLoc}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr className="bg-[#161513]">
                    <td className="sticky-col p-4 border-t border-[#3a3730]"></td>
                    {displayed.map(vehicle => (
                      <ActionCell key={vehicle.id} vehicle={vehicle} onRemove={handleRemove} />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Fleet Selection Summary */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Fleet Selection Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Avg Asking Price</div>
                <div className="text-2xl font-bold text-gray-200">
                  {displayed.length > 0
                    ? `$${Math.round(displayed.reduce((s, v) => s + parseInt(v.price.replace(/[$,]/g, '')), 0) / displayed.length).toLocaleString()}`
                    : '--'}
                </div>
                <div className="absolute right-0 bottom-0 opacity-5">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                  </svg>
                </div>
              </div>

              <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Instant Equity</div>
                <div className="text-2xl font-bold text-emerald-400">+$2,100</div>
                <div className="text-xs text-gray-500 mt-1">Across {displayed.length} vehicles</div>
              </div>

              <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Avg Payback (Eligible)</div>
                <div className="text-2xl font-bold text-gray-200">11.6 mo</div>
                <div className="text-xs text-gray-500 mt-1">Excludes disqualified</div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 flex flex-col justify-center relative">
                <div className="text-[10px] text-emerald-500 uppercase tracking-wide mb-1 font-bold">Best Value Pick</div>
                <div className="text-lg font-bold text-emerald-100 truncate leading-tight">2018 Toyota Camry</div>
                <div className="text-xs text-emerald-400 mt-1">Score: 92 • +$2.3k Equity</div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/20">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 flex flex-col justify-center relative">
                <div className="text-[10px] text-red-500 uppercase tracking-wide mb-1 font-bold">Highest Risk Pick</div>
                <div className="text-lg font-bold text-red-100 truncate leading-tight">2020 Hyundai Elantra</div>
                <div className="text-xs text-red-400 mt-1">Score: 61 • Critical Trans Issue</div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/20">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

const App = () => {
  const [activeNav, setActiveNav] = useState('Fleet Dashboard');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customStyles.scrollbar;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="bg-[#0a0905] text-gray-200 h-screen w-full flex overflow-hidden font-sans" style={{ userSelect: 'none' }}>
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      <FleetDashboard />
    </div>
  );
};

export default App;