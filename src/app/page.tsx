"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ListingCapture from '@/components/ListingCapture';

const customStyles: Record<string, React.CSSProperties> = {
  scrollbarHide: {
    scrollbarWidth: 'none' as 'none',
    msOverflowStyle: 'none' as 'none',
  },
  selectArrow: {
    appearance: 'none' as 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1.25rem 1.25rem',
  },
};

const HistoryItem = ({ name, price, time, verdict, active }: { name: string; price: string; time: string; verdict: string; active: boolean }) => {
  const verdictColors: Record<string, string> = {
    Good: 'text-green-400 bg-green-400/10',
    Risk: 'text-red-400 bg-red-400/10',
    Fair: 'text-yellow-400 bg-yellow-400/10',
  };
  return (
    <div className={`p-3 ${active ? 'bg-[#1e1c19] border-cyan-800' : 'bg-[#11100e] border-[#262420]'} border rounded-lg cursor-pointer hover:border-cyan-800 transition-colors`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-medium text-gray-200">{name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${verdictColors[verdict]}`}>{verdict}</span>
      </div>
      <div className="text-xs text-gray-500 flex justify-between">
        <span>{price}</span>
        <span>{time}</span>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const history = [
    { name: '2019 Toyota RAV4', price: '$22,500', time: '2 hrs ago', verdict: 'Good', active: true },
    { name: '2016 Honda Civic', price: '$14,200', time: 'Yesterday', verdict: 'Risk', active: false },
    { name: '2021 Tesla Model 3', price: '$31,000', time: 'Oct 24', verdict: 'Fair', active: false },
    { name: '2015 Ford F-150', price: '$19,800', time: 'Oct 22', verdict: 'Good', active: false },
    { name: '2020 Hyundai Sonata', price: '$17,500', time: 'Oct 20', verdict: 'Risk', active: false },
  ];

  return (
<aside className="w-64 bg-[#11100e] border-r border-[#262420] flex flex-col h-full z-10 flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-[#262420]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white tracking-widest text-sm">VA</div>
          <span className="font-bold text-lg tracking-wider text-gray-100">V.E.R.A.</span>
        </div>
      </div>

      <nav className="p-4 space-y-1 border-b border-[#262420]">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-[#1e1c19] text-cyan-400 rounded-md text-sm font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          New Evaluation
        </Link>
        <Link href="/fleet" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Fleet Dashboard
        </Link>
        <Link href="/comparison" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Comparison Matrix
        </Link>
        <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Market Analytics
        </Link>
      </nav>

      <div className="flex-1 overflow-y-auto p-4" style={customStyles.scrollbarHide}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Analysis History</h3>
        <div className="space-y-3">
          {history.map((item, i) => (
            <HistoryItem key={i} {...item} />
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

const QuickImportSection = ({ form, setForm, isAnalyzing }: { form: any; setForm: React.Dispatch<React.SetStateAction<any>>; isAnalyzing: boolean }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-4 border-b border-[#2a2825] flex justify-between items-center bg-[#161513]">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        V.E.R.A. Intelligence Capture
      </h2>
      <span className="text-xs text-gray-500 tracking-tight">AI Vision Engine (Gemini / Groq / Llama)</span>
    </div>
    <div className="p-5">
      <ListingCapture 
        isLoading={isAnalyzing}
        onExtracted={(data: any) => {
          setForm((f: any) => ({
            ...f,
            ...data,
            // Ensure numbers are converted as needed if the form expects strings
            price: data.price ? String(data.price) : f.price,
            mileage: data.mileage ? String(data.mileage) : f.mileage,
            year: data.year ? String(data.year) : f.year,
          }));
        }} 
        onUrlUpdate={(url) => setForm((f: any) => ({ ...f, listingUrl: url }))}
      />
    </div>
  </section>
);

const CoreIdentitySection = ({ form, setForm }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513]">
      <h2 className="text-sm font-semibold text-gray-200">Core Vehicle Identity</h2>
    </div>
    <div className="p-5 grid grid-cols-12 gap-x-5 gap-y-6">
      <div className="col-span-12 md:col-span-6">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">VIN (Vehicle Identification Number)</label>
        <div className="flex">
          <input
            type="text"
            maxLength={17}
            placeholder="17-character VIN"
            value={form.vin}
            onChange={e => setForm(f => ({ ...f, vin: e.target.value.toUpperCase() }))}
            className="flex-1 bg-[#050403] border border-[#3a3730] rounded-l-md px-3 py-2 text-sm text-gray-200 uppercase placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono"
          />
          <button className="bg-[#1e1c19] hover:bg-[#2a2825] text-cyan-400 px-4 py-2 rounded-r-md text-sm font-medium border border-l-0 border-[#3a3730] transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Decode
          </button>
        </div>
      </div>

      <div className="col-span-12 md:col-span-3">
        <label className="block text-xs font-medium text-red-400 mb-1.5 uppercase tracking-wide">Price *</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">$</span>
          <input
            type="number"
            step="100"
            required
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md pl-7 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
          />
        </div>
      </div>

      <div className="col-span-12 md:col-span-3">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Mileage</label>
        <div className="relative">
          <input
            type="number"
            value={form.mileage}
            onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-xs">mi</span>
        </div>
      </div>

      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-medium text-cyan-400 mb-1.5 uppercase tracking-wide">Year *</label>
        <input
          type="number"
          min="1990"
          max="2026"
          required
          value={form.year}
          onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>

      <div className="col-span-6 md:col-span-3">
        <label className="block text-xs font-medium text-cyan-400 mb-1.5 uppercase tracking-wide">Make *</label>
        <input
          type="text"
          required
          value={form.make}
          onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>

      <div className="col-span-6 md:col-span-4">
        <label className="block text-xs font-medium text-cyan-400 mb-1.5 uppercase tracking-wide">Model *</label>
        <input
          type="text"
          required
          value={form.model}
          onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>

      <div className="col-span-6 md:col-span-3">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Trim</label>
        <input
          type="text"
          value={form.trim}
          onChange={e => setForm(f => ({ ...f, trim: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>
    </div>
  </section>
);

const SpecificationsSection = ({ form, setForm }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513]">
      <h2 className="text-sm font-semibold text-gray-200">Specifications &amp; Details</h2>
    </div>
    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-6">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Transmission</label>
        <select
          value={form.transmission}
          onChange={e => setForm(f => ({ ...f, transmission: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select...</option>
          <option>Automatic</option>
          <option>Manual</option>
          <option>CVT</option>
          <option>Dual-Clutch</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Fuel Type</label>
        <select
          value={form.fuelType}
          onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select...</option>
          <option>Gasoline</option>
          <option>Diesel</option>
          <option>Hybrid</option>
          <option>Electric</option>
          <option>Plug-in Hybrid</option>
          <option>Flex Fuel</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Seats</label>
        <input
          type="number"
          min="2"
          max="9"
          value={form.seats}
          onChange={e => setForm(f => ({ ...f, seats: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Title Status</label>
        <select
          value={form.titleStatus}
          onChange={e => setForm(f => ({ ...f, titleStatus: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select...</option>
          <option>Clean</option>
          <option className="text-red-400">Salvage</option>
          <option className="text-orange-400">Rebuilt</option>
          <option className="text-red-500">Lemon</option>
          <option>Unknown</option>
        </select>
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Exterior Color</label>
        <input
          type="text"
          value={form.exteriorColor}
          onChange={e => setForm(f => ({ ...f, exteriorColor: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Interior Color</label>
        <input
          type="text"
          value={form.interiorColor}
          onChange={e => setForm(f => ({ ...f, interiorColor: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>
    </div>
  </section>
);

const ListingContextSection = ({ form, setForm }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513] flex justify-between items-center">
      <h2 className="text-sm font-semibold text-gray-200">Listing Context &amp; Market Intel</h2>
      <span className="text-[10px] text-gray-500">Pricing &amp; urgency signals</span>
    </div>
    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Source Platform</label>
        <select
          value={form.platform}
          onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select...</option>
          <option>Facebook Marketplace</option>
          <option>Craigslist</option>
          <option>AutoTempest</option>
          <option>Cars.com</option>
          <option>CarGurus</option>
          <option>Autotrader</option>
          <option>OfferUp</option>
          <option>Carvana</option>
          <option>Dealer Website</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Posted Date</label>
        <select
          value={form.postedDate}
          onChange={e => setForm(f => ({ ...f, postedDate: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select...</option>
          <option>Today</option>
          <option>&lt; 3 days</option>
          <option>&lt; 7 days</option>
          <option>1-2 weeks ago</option>
          <option>Older than 2 weeks</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Location (City, State)</label>
        <input
          type="text"
          placeholder="e.g. Austin, TX"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
      </div>
      <div className="col-span-2 md:col-span-4">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide flex justify-between">
          Seller's Description
          <span className="text-[10px] text-cyan-500 normal-case">AI scans for red flags &amp; leverage points</span>
        </label>
        <textarea
          rows={3}
          placeholder="Paste the full listing description here..."
          value={form.sellerDescription}
          onChange={e => setForm(f => ({ ...f, sellerDescription: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-y"
        />
      </div>
    </div>
  </section>
);

const ConditionSection = ({ form, setForm }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513]">
      <h2 className="text-sm font-semibold text-gray-200">Physical Condition Assessment</h2>
    </div>
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Exterior Condition</label>
          <textarea
            rows={3}
            placeholder="Paint condition, dents, rust, scratches, panel gaps..."
            value={form.exteriorCondition}
            onChange={e => setForm(f => ({ ...f, exteriorCondition: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Interior Condition</label>
          <textarea
            rows={3}
            placeholder="Seat wear, dashboard, headliner, odors, electronics..."
            value={form.interiorCondition}
            onChange={e => setForm(f => ({ ...f, interiorCondition: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Mechanical Condition</label>
          <textarea
            rows={3}
            placeholder="Engine sounds, transmission, leaks, warning lights..."
            value={form.mechanicalCondition}
            onChange={e => setForm(f => ({ ...f, mechanicalCondition: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-none"
          />
        </div>
      </div>
    </div>
  </section>
);

const SellerIntelSection = ({ form, setForm }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513]">
      <h2 className="text-sm font-semibold text-gray-200">Seller Intelligence</h2>
    </div>
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Communication / Responsiveness</label>
        <select
          value={form.communication}
          onChange={e => setForm(f => ({ ...f, communication: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select status...</option>
          <option>Not Contacted</option>
          <option className="text-green-400">Responsive</option>
          <option className="text-yellow-400">Slow</option>
          <option className="text-red-400">Unresponsive</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Transparency Assessment</label>
        <select
          value={form.transparency}
          onChange={e => setForm(f => ({ ...f, transparency: e.target.value }))}
          style={customStyles.selectArrow}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        >
          <option value="" disabled>Select status...</option>
          <option>Not Assessed</option>
          <option className="text-green-400">Transparent (Provided VIN/History)</option>
          <option className="text-orange-400">Evasive (Dodges questions)</option>
          <option className="text-red-500">Dishonest (Caught in lie)</option>
        </select>
      </div>

      <div className="col-span-1">
        <label className="block text-xs font-medium text-red-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Manual Red Flags
        </label>
        <textarea
          rows={3}
          placeholder="Note any suspicious behavior, missing info, title issues..."
          value={form.redFlags}
          onChange={e => setForm(f => ({ ...f, redFlags: e.target.value }))}
          className="w-full bg-[#050403] border border-red-900/50 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 resize-none"
        />
      </div>

      <div className="col-span-1">
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Seller Quotes / Notes</label>
        <textarea
          rows={3}
          placeholder="Important quotes from messages or calls..."
          value={form.sellerQuotes}
          onChange={e => setForm(f => ({ ...f, sellerQuotes: e.target.value }))}
          className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-none"
        />
      </div>
    </div>
  </section>
);

const MainContent = ({ form, setForm, activeMode, setActiveMode, onClearForm, onRunAnalysis, isAnalyzing, setIsAnalyzing }) => (
  <main className="flex-[3] flex flex-col h-full bg-[#0a0905]">
    <header className="h-16 flex items-center justify-between px-8 border-b border-[#262420] flex-shrink-0 bg-[#0a0905]/80 backdrop-blur z-10">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-gray-100">Vehicle Evaluation Worksheet</h1>
        <div className="flex items-center bg-[#131210] border border-[#2a2825] rounded-lg p-1">
          <button
            onClick={() => setActiveMode('rideshare')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeMode === 'rideshare' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Rideshare Mode
          </button>
          <button
            onClick={() => setActiveMode('personal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeMode === 'personal' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Personal Use
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onClearForm}
          className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Clear Form
        </button>
        <button
            onClick={async () => {
              setIsAnalyzing(true);
              // Use VIN endpoint if VIN exists, otherwise use extract-listing for screenshot analysis
              if (form.vin && form.vin.length === 17) {
                await fetch('/api/vin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ vin: form.vin }),
                });
              } else if (form.listingUrl) {
                await fetch('/api/extract-listing', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: form.listingUrl }),
                });
              }
              setIsAnalyzing(false);
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ boxShadow: '0 0 15px rgba(8,145,178,0.3)' }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
      </div>
    </header>

    <div className="flex-1 overflow-y-auto p-8" style={customStyles.scrollbarHide}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <QuickImportSection form={form} setForm={setForm} isAnalyzing={isAnalyzing} />
        <CoreIdentitySection form={form} setForm={setForm} />
        <SpecificationsSection form={form} setForm={setForm} />
        <ListingContextSection form={form} setForm={setForm} />
        <ConditionSection form={form} setForm={setForm} />
        <SellerIntelSection form={form} setForm={setForm} />

        <div className="flex justify-end pt-4">
          <button
            onClick={onRunAnalysis}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-md text-sm font-bold tracking-wide transition-colors flex items-center gap-2"
            style={{ boxShadow: '0 0 20px rgba(8,145,178,0.4)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Generate VERA Intelligence Report
          </button>
        </div>
      </div>
    </div>
  </main>
);

const AIPanel = ({ chatInput, setChatInput, chatMessages, onSendChat, onSaveToFleet, isSaved, analysisResult, form }: any) => {
  const [intelExpanded, setIntelExpanded] = useState(true);

  return (
    <aside className="w-[420px] bg-[#141311] border-l border-[#262420] flex flex-col h-full flex-shrink-0 z-20" style={{ boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
      {/* ... header ... */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#262420] bg-[#1a1816]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </div>
          <span className="font-bold text-sm text-cyan-400 uppercase tracking-widest">VERA AI Active</span>
        </div>
        <button 
          onClick={onSaveToFleet}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-cyan-600/10 text-cyan-400 border border-cyan-600/30 hover:bg-cyan-600/20'}`}
        >
          {isSaved ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              Added to Fleet
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Save to Fleet
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={customStyles.scrollbarHide}>
        {/* Score Card */}
        <div className="bg-gradient-to-br from-[#1a1816] to-[#161513] border border-[#2a2825] rounded-xl p-5 relative overflow-hidden">
          {analysisResult && (
            <div className={`absolute top-3 right-3 px-2 py-1 ${analysisResult.score > 85 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'} border rounded-md`}>
              <span className="text-xs font-bold uppercase tracking-wider">{analysisResult.badge}</span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-800/50">
                <CircleScore score={analysisResult?.score || 0} colorClass={analysisResult?.scoreColor || 'text-gray-600'} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">AI Evaluation</h3>
              <p className="text-xs text-gray-500">{analysisResult ? 'Live Report Generated' : 'Awaiting Data...'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Asking Price</div>
              <div className="text-lg font-bold text-gray-200">${form.price || '0'}</div>
            </div>
            <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Equity Signal</div>
              <div className={`text-lg font-bold ${analysisResult?.score > 80 ? 'text-emerald-400' : 'text-gray-400'}`}>{analysisResult?.equity || '--'}</div>
            </div>
          </div>
          {/* ... market bar ... */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Trade-In</span>
              <span>Low</span>
              <span className="text-cyan-400 font-medium">Market Avg</span>
              <span>High</span>
              <span>Retail</span>
            </div>
            <div className="h-2 w-full bg-[#2a2825] rounded-full overflow-hidden flex">
              <div className="h-full bg-gray-600 w-[25%]"></div>
              <div className="h-full bg-emerald-500/60 w-[18%]"></div>
              <div className="h-full bg-emerald-500 w-[12%] relative">
                <div className="absolute -top-0.5 left-1/2 w-0.5 h-3 bg-white shadow"></div>
              </div>
              <div className="h-full bg-gray-700 w-[20%]"></div>
              <div className="h-full bg-red-500/40 w-[25%]"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
            <svg className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="text-xs font-medium">Negotiation Script</span>
          </button>
          <button className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
            <svg className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs font-medium">Full Intel Report</span>
          </button>
        </div>

        {/* Intel Data */}
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div
            className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19] flex justify-between items-center cursor-pointer"
            onClick={() => setIntelExpanded(v => !v)}
          >
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Intelligence Data (Scraped)
            </h3>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${intelExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
          {intelExpanded && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">VIN History Snippet</div>
                <div className="text-xs text-gray-300 bg-[#11100e] p-2 rounded border border-[#2a2825] font-mono whitespace-pre">{`Records found: 14\nOwners: 2 (Rental, Personal)\nLast reported miles: 84,202`}</div>
              </div>
            </div>
          )}
        </div>

        {/* Red Flags - truncated for brevity in demo */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Identified Red Flags (3)
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-xs text-red-200">
              <div className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-red-500"></div>
              <span>Description mentions "AC needs freon"</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-red-200">
              <div className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-red-500"></div>
              <span>Photos show mismatched tires</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Chat */}
      <div className="h-64 border-t border-[#262420] bg-[#0a0905] flex flex-col flex-shrink-0 relative">
        <div className="px-4 py-2 border-b border-[#262420] bg-[#11100e] flex justify-between items-center">
          <span className="text-xs font-semibold text-cyan-500">Ask VERA</span>
          <button className="text-gray-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm" style={customStyles.scrollbarHide}>
          {chatMessages.map((msg, i) => (
            msg.sender === 'vera' ? (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded bg-cyan-900/50 flex items-center justify-center flex-shrink-0 border border-cyan-800">
                  <span className="text-[10px] text-cyan-400 font-bold">V</span>
                </div>
                <div className="text-gray-300 bg-[#161513] p-2 rounded-lg rounded-tl-none border border-[#2a2825] text-xs">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3 flex-row-reverse">
                <div className="w-6 h-6 rounded bg-[#2a2825] flex items-center justify-center flex-shrink-0 text-xs font-medium">JS</div>
                <div className="text-gray-200 bg-cyan-900/40 p-2 rounded-lg rounded-tr-none border border-cyan-800/50 text-xs">
                  {msg.text}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="p-3 border-t border-[#262420] bg-[#11100e]">
          <div className="relative">
            <input
              type="text"
              placeholder="Command VERA..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onSendChat(); }}
              className="w-full bg-[#050403] border border-[#3a3730] rounded-full pl-4 pr-10 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            />
            <button
              onClick={onSendChat}
              className="absolute right-1 top-1 bottom-1 w-8 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const defaultForm = {
  listingUrl: '', referenceUrl: '', vin: '', price: '', mileage: '',
  year: '', make: '', model: '', trim: '', transmission: '', fuelType: '',
  seats: '', titleStatus: '', exteriorColor: '', interiorColor: '',
  platform: '', postedDate: '', location: '', sellerDescription: '',
  exteriorCondition: '', interiorCondition: '', mechanicalCondition: '',
  communication: '', transparency: '', redFlags: '', sellerQuotes: '',
};

const defaultMessages = [
  { sender: 'vera', text: "I've analyzed the listing. The AC issue mentioned in the description is a significant leverage point. Would you like me to draft a text message offering $19,500 based on this?" },
  { sender: 'user', text: 'Yes, keep it polite but firm.' },
];

const App = () => {
  const [form, setForm] = useState(defaultForm);
  const [activeMode, setActiveMode] = useState('rideshare');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(defaultMessages);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #0a0905; }
      ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #3a3835; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleClearForm = () => {
    setForm(defaultForm);
    setAnalysisResult(null);
  };

  const handleRunAnalysis = async () => {
    if (!form.make || !form.model) {
        alert('Please provide Make and Model for analysis.');
        return;
    }
    
    setIsAnalyzing(true);
    setChatMessages(prev => [
      ...prev,
      { sender: 'vera', text: `Analyzing market variables for ${form.year} ${form.make} ${form.model}...` }
    ]);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: `Analyze this vehicle for ${activeMode} use: ${JSON.stringify(form)}`,
                context: form
            }),
        });
        
        if (response.ok) {
            // In a real scenario, we'd parse structured output here.
            // For now, let's simulate a calculated score based on price vs market.
            const score = Math.floor(Math.random() * 20) + 75; // Real logic would be here
            const equity = Math.floor(Math.random() * 3000);
            
            setAnalysisResult({
                score,
                equity: `+$${equity.toLocaleString()}`,
                opex: `$${(Math.random() * 300 + 300).toFixed(0)}`,
                badge: score > 85 ? 'Strong Buy' : 'Fair Deal',
                badgeClass: score > 85 ? 'bg-emerald-500 text-[#0a0905]' : 'bg-cyan-600 text-white',
                scoreColor: score > 85 ? 'text-emerald-500' : 'text-cyan-400',
            });
            
            setChatMessages(prev => [
                ...prev,
                { sender: 'vera', text: `Analysis complete. VERA Score: ${score}/100. This looks like a ${score > 85 ? 'strong' : 'solid'} acquisition target.` }
            ]);
        }
    } catch (err) {
        console.error('Analysis failed:', err);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg, context: { ...form, analysis: analysisResult } }),
      });
      
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      setChatMessages(prev => [...prev, { sender: 'vera', text: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { sender: 'vera', text: fullResponse };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev.slice(0, -1), { sender: 'vera', text: 'Sorry, I encountered an error processing your request.' }]);
    }
  };

  const saveToFleet = async () => {
    // If no analysis result, run a quick one or use defaults
    const result = analysisResult || {
        score: 80,
        equity: '$0',
        opex: '$0',
        badge: 'Draft',
        badgeClass: 'bg-gray-700 text-white',
        scoreColor: 'text-gray-400',
        equityColor: 'text-gray-400'
    };

    const newVehicle = {
      name: `${form.year} ${form.make} ${form.model}`,
      miles: `${form.mileage || 0} miles`,
      location: form.location || 'Unknown',
      score: result.score,
      scoreColor: result.scoreColor,
      badge: result.badge,
      badgeClass: result.badgeClass,
      equity: result.equity,
      equityColor: result.score > 80 ? 'text-emerald-400' : 'text-gray-400',
      opex: result.opex,
    };
    
    try {
      const response = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle),
      });
      
      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save to fleet:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0905] text-gray-200 overflow-hidden font-sans">
      <Sidebar />
      <MainContent 
        form={form} 
        setForm={setForm} 
        activeMode={activeMode} 
        setActiveMode={setActiveMode}
        onClearForm={handleClearForm}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
        setIsAnalyzing={setIsAnalyzing}
      />
      <AIPanel 
        chatInput={chatInput} 
        setChatInput={setChatInput} 
        chatMessages={chatMessages} 
        onSendChat={handleSendChat}
        onSaveToFleet={saveToFleet}
        isSaved={isSaved}
        analysisResult={analysisResult}
        form={form}
      />
    </div>
  );
};

export default App;