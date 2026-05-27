"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const customStyles: React.CSSProperties = {
  scrollbarWidth: 'none' as 'none',
  msOverflowStyle: 'none' as 'none',
};

const CheckboxItem = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => {
  const [checked, setChecked] = useState(defaultChecked || false);
  return (
    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setChecked(!checked)}>
      <div className="relative flex items-center justify-center">
        <div className={`w-4 h-4 rounded border transition-colors ${checked ? 'bg-cyan-600 border-cyan-600' : 'border-[#3a3730] bg-[#050403]'}`}></div>
        {checked && (
          <svg className="w-3 h-3 text-white absolute pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
};

const ToggleSwitch = ({ defaultOn }: { defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn || false);
  return (
    <div
      className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${on ? 'bg-cyan-600 shadow-[0_0_5px_rgba(8,145,178,0.5)]' : 'bg-[#3a3730]'}`}
      onClick={() => setOn(!on)}
    >
      <div className={`w-3 h-3 rounded-full absolute top-0.5 transition-all ${on ? 'bg-white right-0.5' : 'bg-gray-400 left-0.5'}`}></div>
    </div>
  );
};

const Sidebar = ({ activeNav, setActiveNav }: { activeNav: string; setActiveNav: (id: string) => void }) => {
  return (
    <aside className="w-64 bg-[#11100e] border-r border-[#262420] flex flex-col h-full z-20 flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-[#262420]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white tracking-widest text-sm shadow-[0_0_10px_rgba(8,145,178,0.4)]">
            VA
          </div>
          <span className="font-bold text-lg tracking-wider text-gray-100">V.E.R.A.</span>
        </div>
      </div>

      <nav className="p-4 space-y-1 border-b border-[#262420]">
        <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeNav === 'new' ? 'bg-[#1e1c19] text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Evaluation
        </Link>
        <Link href="/analysis" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeNav === 'analysis' ? 'bg-[#1e1c19] text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Analysis Report
        </Link>
        <Link href="/fleet" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeNav === 'fleet' ? 'bg-[#1e1c19] text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Fleet Dashboard
        </Link>
        <Link href="/comparison" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeNav === 'comparison' ? 'bg-[#1e1c19] text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Comparison Matrix
        </Link>
        <Link href="/analytics" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeNav === 'analytics' ? 'bg-[#1e1c19] text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Market Analytics
        </Link>
      </nav>

      <div className="flex-1 overflow-y-auto p-4" style={customStyles}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Saved Reports</h3>
        <div className="space-y-3">
          {[
            { title: 'Texas Truck Market', updated: 'Today, 08:30 AM' },
            { title: 'National EV Trends', updated: 'Yesterday' },
            { title: 'Q3 Sedan Depreciation', updated: 'Oct 15' },
          ].map((report, i) => (
            <div key={i}
              onClick={() => alert(`Opening "${report.title}" — report viewer coming in next update.`)}
              className="p-3 bg-[#11100e] border border-[#262420] rounded-lg cursor-pointer hover:border-[#3a3730] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-200">{report.title}</span>
              </div>
              <div className="text-[10px] text-gray-500">Updated: {report.updated}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[#262420] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-100 font-bold text-sm border border-cyan-700">JS</div>
        <div className="flex-1">
          <div className="text-sm font-medium">Blake</div>
          <div className="text-xs text-gray-500">Pro Analyst</div>
        </div>
      </div>
    </aside>
  );
};

const RightPanel = () => {
  const [priceMin, setPriceMin] = useState('10,000');
  const [priceMax, setPriceMax] = useState('35,000');
  const [region, setRegion] = useState('tx');
  const [horizon, setHorizon] = useState('30d');

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1rem 1rem',
  };

  return (
    <aside className="w-[340px] bg-[#141311] border-l border-[#262420] flex flex-col h-full flex-shrink-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#262420] bg-[#1a1816]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="font-semibold text-sm text-gray-200 uppercase tracking-wide">Analytics Controls</span>
        </div>
        <button
          className="text-xs text-cyan-500 hover:text-cyan-400 font-medium"
          onClick={() => { setRegion('tx'); setHorizon('30d'); setPriceMin('10,000'); setPriceMax('35,000'); }}
        >
          Reset All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6" style={customStyles}>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Macro Region</label>
          <select
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            style={selectStyle}
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            <option value="tx">Texas (Austin/Dallas/Houston)</option>
            <option value="ca">California (LA/SF/SD)</option>
            <option value="fl">Florida (Miami/Orlando/Tampa)</option>
            <option value="ny">New York Tri-State</option>
            <option value="nat">National Overview</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Vehicle Class Segments</label>
          <div className="space-y-2 bg-[#1a1816] p-3 rounded-lg border border-[#2a2825]">
            <CheckboxItem label="Sedans (Compact & Midsize)" defaultChecked={true} />
            <CheckboxItem label="SUVs & Crossovers" defaultChecked={true} />
            <CheckboxItem label="Trucks (Light & Heavy Duty)" defaultChecked={true} />
            <CheckboxItem label="Electric Vehicles (EV)" defaultChecked={true} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Target Price Range</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-500 text-xs">$</span>
              <input
                type="text"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                className="w-full bg-[#050403] border border-[#3a3730] rounded-md pl-6 pr-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 text-center"
              />
            </div>
            <span className="text-gray-500 text-xs">to</span>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-500 text-xs">$</span>
              <input
                type="text"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                className="w-full bg-[#050403] border border-[#3a3730] rounded-md pl-6 pr-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 text-center"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Data Horizon</label>
          <select
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            style={selectStyle}
            value={horizon}
            onChange={e => setHorizon(e.target.value)}
          >
            <option value="7d">Last 7 Days (Hot)</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days (Quarterly)</option>
            <option value="6m">Last 6 Months</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>

        <button
          className="w-full bg-[#2a2825] hover:bg-[#3a3730] border border-[#3a3730] text-gray-200 py-2.5 rounded-md text-sm font-medium transition-colors"
          onClick={() => {
            // Apply filters to analytics view — triggers re-render with new filter context
            const msg = `Filters applied: Region=${region}, Horizon=${horizon}, Price=$${priceMin}-$${priceMax}`;
            setRegion(region); // Force re-render — real filter logic in backend API
            console.log(msg);
          }}
        >
          Apply Filters
        </button>

        <div className="h-px w-full bg-[#2a2825] my-2"></div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Saved Alert Triggers</label>
            <button
              className="text-cyan-500 hover:text-cyan-400"
              onClick={async () => {
                const name = prompt('Enter alert trigger name:');
                if (name) {
                  const { kvGet, kvSet } = await import('@/lib/kv-client');
                  const alerts = (await kvGet<any[]>('alertTriggers')) || [];
                  alerts.push({ name, region, createdAt: new Date().toISOString() });
                  await kvSet('alertTriggers', alerts);
                  alert(`Alert "${name}" added for ${region} region.`);
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <div className="bg-[#1a1816] p-2.5 rounded border border-[#2a2825] flex justify-between items-center hover:border-[#3a3730]">
              <div>
                <div className="text-xs font-medium text-gray-200">Sedan Price Drop &gt; 5%</div>
                <div className="text-[10px] text-gray-500">Texas Region • Email</div>
              </div>
              <ToggleSwitch defaultOn={true} />
            </div>
            <div className="bg-[#1a1816] p-2.5 rounded border border-[#2a2825] flex justify-between items-center hover:border-[#3a3730]">
              <div>
                <div className="text-xs font-medium text-gray-200">Tacoma Inventory Spike</div>
                <div className="text-[10px] text-gray-500">Austin Only • Push</div>
              </div>
              <ToggleSwitch defaultOn={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-[#262420] bg-[#11100e]">
        <button
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-md text-sm font-bold tracking-wide transition-colors shadow-[0_0_15px_rgba(8,145,178,0.3)] flex items-center justify-center gap-2"
          onClick={() => {
            const csvRows = [
              'Metric,Value',
              `Region,${region}`,
              `Horizon,${horizon}`,
              `Price Range,$${priceMin}-$${priceMax}`,
              'Market Heat Index,Warm',
              'Avg Days on Market,14.2',
              'Price Negotiation Room,8.4%',
              'Top Opportunity,2017-2019 Midsize Sedans',
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `market-report-${region}-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Market Report (CSV)
        </button>
        <p className="text-center text-[10px] text-gray-500 mt-3">Generated based on current filter state</p>
      </div>
    </aside>
  );
};

const KPICards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Market Heat Index</h3>
      <div className="flex items-end gap-3 mb-1 relative z-10">
        <span className="text-3xl font-bold text-gray-100">Warm</span>
        <div className="flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-500/20 font-medium mb-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          12% vs LM
        </div>
      </div>
      <p className="text-xs text-gray-500 relative z-10">Inventory turning faster than usual.</p>
    </div>

    <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Avg Days on Market</h3>
      <div className="flex items-end gap-3 mb-1 relative z-10">
        <span className="text-3xl font-bold text-gray-100">14.2</span>
        <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-500/20 font-medium mb-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
          3 days
        </div>
      </div>
      <p className="text-xs text-gray-500 relative z-10">Speed to sale is accelerating.</p>
    </div>

    <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Negotiation Room</h3>
      <div className="flex items-end gap-3 mb-1 relative z-10">
        <span className="text-3xl font-bold text-gray-100">8.4%</span>
        <span className="text-xs text-gray-400 mb-1.5 font-medium">Avg below asking</span>
      </div>
      <div className="w-full bg-[#2a2825] h-1.5 mt-3 rounded-full overflow-hidden relative z-10">
        <div className="bg-green-500 h-full w-[8.4%]"></div>
      </div>
    </div>

    <div className="bg-[#131210] border border-[#2a2825] rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Opportunity Segment</h3>
      <div className="flex items-end gap-3 mb-1 relative z-10">
        <span className="text-xl font-bold text-gray-100 leading-tight">2017-2019<br />Midsize Sedans</span>
      </div>
      <p className="text-[10px] text-purple-400 font-medium mt-2 relative z-10 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        High margin potential
      </p>
    </div>
  </div>
);

const PriceTrendChart = () => {
  const [activeTab, setActiveTab] = useState('Prices');

  return (
    <section className="col-span-12 lg:col-span-8 bg-[#131210] border border-[#2a2825] rounded-xl shadow-sm flex flex-col h-[400px]">
      <div className="px-5 py-4 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center rounded-t-xl">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          6-Month Price &amp; Volume Trends
        </h2>
        <div className="flex bg-[#0a0905] rounded-md border border-[#3a3730] p-0.5">
          {['Prices', 'Volume'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === tab ? 'bg-[#2a2825] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-5 relative">
        <div className="flex gap-4 mb-4 justify-end">
          {[
            { label: 'SUVs', color: '#06b6d4' },
            { label: 'Trucks', color: '#10b981' },
            { label: 'Sedans', color: '#8b5cf6' },
            { label: 'EVs', color: '#f97316' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
              {item.label}
            </div>
          ))}
        </div>

        <div className="absolute inset-0 top-16 left-5 right-5 bottom-8">
          <div className="h-full w-full flex flex-col justify-between border-l border-b border-[#3a3730] relative z-0">
            <div className="w-full border-t border-[#262420] absolute top-[0%]"></div>
            <div className="w-full border-t border-[#262420] absolute top-[25%]"></div>
            <div className="w-full border-t border-[#262420] absolute top-[50%]"></div>
            <div className="w-full border-t border-[#262420] absolute top-[75%]"></div>
          </div>

          <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-500 h-full py-0 text-right w-8">
            <span>$45k</span><span>$35k</span><span>$25k</span><span>$15k</span><span>$5k</span>
          </div>

          <div className="absolute left-0 right-0 -bottom-6 flex justify-between text-[10px] text-gray-500">
            <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
          </div>

          <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,40 Q20,38 40,42 T60,45 T80,48 T100,45" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="0" />
            <path d="M0,20 Q20,25 40,22 T60,18 T80,15 T100,10" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="0" />
            <path d="M0,70 Q20,72 40,68 T60,65 T80,60 T100,55" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="0" />
            <path d="M0,15 Q20,30 40,45 T60,65 T80,80 T100,85" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="0" />
            <circle cx="100" cy="45" r="2" fill="#06b6d4" />
            <circle cx="100" cy="10" r="2" fill="#10b981" />
            <circle cx="100" cy="55" r="2" fill="#8b5cf6" />
            <circle cx="100" cy="85" r="2" fill="#f97316" />
          </svg>
        </div>
      </div>
    </section>
  );
};

const AnomaliesPanel = () => {
  const anomalies = [
    {
      type: 'red',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />,
      title: 'Sedan Prices Dropping',
      desc: 'Austin metro seeing a -5% WoW drop in compact sedan asking prices. Inventory buildup detected.',
      time: '14 mins ago',
    },
    {
      type: 'cyan',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />,
      title: 'High Volume Listing Spikes',
      desc: 'Surge of 2020 Honda Accords listed in Dallas (+42 listings today). Possible fleet sell-off.',
      time: '1 hr ago',
    },
    {
      type: 'yellow',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      title: 'Truck Inventory Low',
      desc: 'Full-size truck inventory in Houston falls below 30-day supply. Expect tighter margins.',
      time: '3 hrs ago',
    },
  ];

  const iconStyles: Record<string, string> = {
    red: 'bg-red-950/50 border-red-900/30 text-red-500',
    cyan: 'bg-cyan-950/50 border-cyan-900/30 text-cyan-400',
    yellow: 'bg-yellow-900/30 border-yellow-900/50 text-yellow-500',
  };

  return (
    <section className="col-span-12 lg:col-span-4 bg-[#131210] border border-[#2a2825] rounded-xl shadow-sm flex flex-col h-[400px]">
      <div className="px-5 py-4 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center rounded-t-xl">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Live Market Anomalies
        </h2>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={customStyles}>
        {anomalies.map((a, i) => (
          <div key={i}
            onClick={() => alert(`${a.title}: ${a.desc}`)}
            className="p-3 hover:bg-[#1a1816] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[#3a3730]">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border mt-0.5 ${iconStyles[a.type]}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{a.icon}</svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-200">{a.title}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{a.desc}</p>
                <div className="text-[10px] text-gray-500 mt-2 font-mono">{a.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const HeatmapSection = () => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const rows = [
    {
      label: '23-24',
      cells: [
        { bg: 'bg-red-500/30 border-red-500/20', hover: 'Sat', textColor: 'text-red-200' },
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: 'Avg', textColor: 'text-gray-300' },
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: '', textColor: '' },
        { bg: 'bg-red-500/50 border-red-500/40', hover: '', textColor: '' },
        { bg: 'bg-green-500/20 border-green-500/10', hover: '', textColor: '' },
      ],
    },
    {
      label: '20-22',
      cells: [
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: '', textColor: '' },
        { bg: 'bg-green-500/40 border-green-500/30', hover: 'Buy', textColor: 'text-green-100', alwaysShow: true },
        { bg: 'bg-red-500/20 border-red-500/10', hover: '', textColor: '' },
        { bg: 'bg-orange-500/30 border-orange-500/20', hover: '', textColor: '' },
        { bg: 'bg-green-500/60 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]', hover: 'Top Pick', textColor: 'text-green-50', alwaysShow: true, multiLine: true },
      ],
    },
    {
      label: '17-19',
      cells: [
        { bg: 'bg-green-500/50 border-green-500/40', hover: '', textColor: '' },
        { bg: 'bg-green-500/80 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]', hover: '#1', textColor: 'text-white', alwaysShow: true },
        { bg: 'bg-green-500/30 border-green-500/20', hover: '', textColor: '' },
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: '', textColor: '' },
        { bg: 'bg-red-500/40 border-red-500/30', hover: '', textColor: '' },
      ],
    },
    {
      label: '< 16',
      cells: [
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: '', textColor: '' },
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: '', textColor: '' },
        { bg: 'bg-red-500/60 border-red-500/50', hover: '', textColor: '' },
        { bg: 'bg-green-500/20 border-green-500/10', hover: '', textColor: '' },
        { bg: 'bg-[#2a2825] border-[#3a3730]', hover: '', textColor: '' },
      ],
    },
  ];

  return (
    <section className="col-span-12 lg:col-span-7 bg-[#131210] border border-[#2a2825] rounded-xl shadow-sm flex flex-col">
      <div className="px-5 py-4 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center rounded-t-xl">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Opportunity Heatmap (Age vs. Class)
          </h2>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Green = High Opportunity / Red = Saturated Market</p>
        </div>
      </div>
      <div className="p-5 flex-1 overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-6 gap-2 mb-2 text-center text-xs font-medium text-gray-400">
            <div></div>
            {['Compact', 'Midsize', 'Full-size', 'SUV', 'Truck'].map(h => <div key={h}>{h}</div>)}
          </div>
          <div className="space-y-2">
            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-6 gap-2">
                <div className="flex items-center justify-end pr-2 text-xs font-medium text-gray-400">{row.label}</div>
                {row.cells.map((cell, ci) => {
                  const key = `${ri}-${ci}`;
                  return (
                    <div
                      key={ci}
                      className={`${cell.bg} border rounded h-12 cursor-pointer relative transition-all duration-200 ${selectedCell === key ? 'ring-2 ring-cyan-400' : ''}`}
                      style={{ transform: hoveredCell === key ? 'scale(1.05)' : 'scale(1)', zIndex: hoveredCell === key ? 10 : 1, boxShadow: hoveredCell === key ? '0 4px 12px rgba(0,0,0,0.5)' : undefined }}
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => setSelectedCell(selectedCell === key ? null : key)}
                    >
                      {cell.alwaysShow && cell.hover && (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center ${cell.textColor}`}>
                          {cell.multiLine ? (
                            <>
                              <span className="text-[10px] leading-tight">Top</span>
                              <span className="text-xs font-bold leading-tight">Pick</span>
                            </>
                          ) : (
                            <span className="text-xs font-bold">{cell.hover}</span>
                          )}
                        </div>
                      )}
                      {!cell.alwaysShow && cell.hover && hoveredCell === key && (
                        <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${cell.textColor}`}>
                          {cell.hover}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const MetroVarianceSection = () => (
  <section className="col-span-12 lg:col-span-5 bg-[#131210] border border-[#2a2825] rounded-xl shadow-sm flex flex-col">
    <div className="px-5 py-4 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center rounded-t-xl">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Metro Area Variance
      </h2>
      <button
        className="text-[10px] text-cyan-500 hover:text-cyan-400 uppercase tracking-wide font-medium"
        onClick={() => window.open('https://www.google.com/maps/search/used+car+dealers+Texas', '_blank')}
      >
        View Map
      </button>
    </div>
    <div className="p-5 flex-1 flex flex-col justify-center space-y-5">
      {[
        { rank: 1, city: 'Houston', discount: '-9.2%', discountColor: 'text-green-400', barColor: 'bg-cyan-500', barW: 'w-[65%]', left: 'High Listing Density', right: 'Highest negotiation room', rankBg: 'bg-cyan-900/50 border-cyan-800 text-cyan-400' },
        { rank: 2, city: 'Dallas-Ft. Worth', discount: '-7.5%', discountColor: 'text-green-400', barColor: 'bg-cyan-600', barW: 'w-[50%]', left: 'Moderate Density', right: 'Average negotiation', rankBg: 'bg-[#1e1c19] border-[#3a3730] text-gray-400' },
        { rank: 3, city: 'Austin', discount: '-4.1%', discountColor: 'text-orange-400', barColor: 'bg-orange-500', barW: 'w-[30%]', left: 'Low Density', right: 'Sellers market (tight)', rankBg: 'bg-[#1e1c19] border-[#3a3730] text-gray-400' },
      ].map((m, i) => (
        <div key={i}>
          <div className="flex justify-between items-end mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${m.rankBg}`}>{m.rank}</div>
              <span className="text-sm font-medium text-gray-200">{m.city}</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold ${m.discountColor}`}>{m.discount}</span>
              <span className="text-[10px] text-gray-500 ml-1">avg discount</span>
            </div>
          </div>
          <div className="h-2 w-full bg-[#2a2825] rounded-full overflow-hidden flex relative">
            <div className={`h-full ${m.barColor} ${m.barW}`}></div>
            <div className={`absolute inset-y-0 ${m.barW} w-px bg-white/20`}></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>{m.left}</span>
            <span>{m.right}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const PlatformSourcingSection = () => (
  <section className="col-span-12 lg:col-span-6 bg-[#131210] border border-[#2a2825] rounded-xl shadow-sm flex flex-col">
    <div className="px-5 py-4 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center rounded-t-xl">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        Platform Sourcing Intel
      </h2>
    </div>
    <div className="p-5 flex-1 grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Volume by Source</h3>
        <div className="space-y-3">
          {[
            { name: 'FB Marketplace', pct: '42%', w: 'w-[42%]', bar: 'bg-blue-500' },
            { name: 'CarGurus', pct: '28%', w: 'w-[28%]', bar: 'bg-green-500' },
            { name: 'Autotrader', pct: '18%', w: 'w-[18%]', bar: 'bg-orange-500' },
            { name: 'Craigslist', pct: '12%', w: 'w-[12%]', bar: 'bg-purple-500' },
          ].map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{s.name}</span>
                <span className="text-gray-500">{s.pct}</span>
              </div>
              <div className="h-1.5 w-full bg-[#2a2825] rounded-full overflow-hidden">
                <div className={`h-full ${s.bar} ${s.w}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Metrics</h3>
        {[
          { label: 'Avg Response Time', name: 'FB Marketplace', value: '< 1 hr', valueColor: 'text-green-400' },
          { label: 'Trust / Scrape Quality', name: 'CarGurus', value: 'High', valueColor: 'text-cyan-400' },
          { label: 'Price Variance', name: 'Craigslist', value: 'Volatile', valueColor: 'text-orange-400' },
        ].map((m, i) => (
          <div key={i} className="bg-[#1a1816] border border-[#2a2825] rounded p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
              <div className="text-sm font-medium text-gray-200">{m.name}</div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${m.valueColor}`}>{m.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const TimingSection = () => (
  <section className="col-span-12 lg:col-span-6 bg-[#131210] border border-[#2a2825] rounded-xl shadow-sm flex flex-col">
    <div className="px-5 py-4 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center rounded-t-xl">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Timing &amp; Seasonality
      </h2>
    </div>
    <div className="p-5 flex-1 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-medium text-gray-300">Best Days to Buy (Historical)</h3>
          <p className="text-[10px] text-gray-500">Based on lowest avg closing prices</p>
        </div>
        <div className="flex gap-1 text-[10px] text-gray-500 items-center">
          Low
          <span className="w-2 h-2 bg-[#2a2825] rounded ml-1 mr-0.5"></span>
          <span className="w-2 h-2 bg-cyan-900/50 rounded mx-0.5"></span>
          <span className="w-2 h-2 bg-cyan-500 rounded ml-0.5 mr-1"></span>
          High
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-500 mb-1">{d}</div>
        ))}
        {[
          'bg-[#2a2825] border-[#3a3730]',
          'bg-cyan-900/30 border-cyan-900/20',
          'bg-[#2a2825] border-[#3a3730]',
          'bg-cyan-500/80 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
          'bg-[#2a2825] border-[#3a3730]',
          'bg-[#1e1c19] border-[#2a2825]',
          'bg-[#1e1c19] border-[#2a2825]',
          'bg-[#2a2825] border-[#3a3730]',
          'bg-[#2a2825] border-[#3a3730]',
          'bg-[#2a2825] border-[#3a3730]',
          'bg-cyan-500/60 border-cyan-500/40',
          'bg-cyan-900/50 border-cyan-900/30',
          'bg-[#1e1c19] border-[#2a2825]',
          'bg-[#1e1c19] border-[#2a2825]',
        ].map((cls, i) => (
          <div key={i} className={`h-6 rounded border ${cls} flex items-center justify-center`}>
            {i === 3 && <span className="text-[8px] font-bold text-white opacity-0 hover:opacity-100 transition-opacity">BUY</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1816] p-3 rounded-lg border border-[#2a2825]">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Month-over-Month</div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span className="text-sm font-medium text-gray-200">Prices down 2.1%</span>
          </div>
        </div>
        <div className="bg-[#1a1816] p-3 rounded-lg border border-[#2a2825]">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Best time: Trucks</div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-200">End of Q3</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const MarketAnalyticsPage = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0905] relative z-10 min-w-0">
      <header className="h-16 flex items-center justify-between px-8 border-b border-[#262420] flex-shrink-0 bg-[#0a0905]/95 backdrop-blur z-20 sticky top-0">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-100 tracking-tight">Market Analytics</h1>
          <div className="mx-4 h-5 w-px bg-[#3a3730]"></div>
          <div className="flex items-center gap-2 text-sm text-cyan-500 bg-cyan-950/30 px-3 py-1.5 rounded-md border border-cyan-900/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Texas Region (Austin, Dallas, Houston)
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Data
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">Last updated: Just now</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8" style={customStyles}>
        <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
          <KPICards />
          <div className="grid grid-cols-12 gap-6">
            <PriceTrendChart />
            <AnomaliesPanel />
            <HeatmapSection />
            <MetroVarianceSection />
            <PlatformSourcingSection />
            <TimingSection />
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeNav, setActiveNav] = useState('analytics');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #0a0905; }
      ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #3a3835; }
      @keyframes drawLine { to { stroke-dashoffset: 0; } }
      .heatmap-cell:hover { border-color: #0891b2; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="bg-[#0a0905] text-gray-200 h-screen w-full flex overflow-hidden font-sans selection:bg-cyan-900 selection:text-white">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      <MarketAnalyticsPage />
      <RightPanel />
    </div>
  );
};

export default App;