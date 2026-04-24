"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
        <Link href="/fleet" className="flex items-center gap-3 px-3 py-2 bg-[#1e1c19] text-cyan-400 rounded-md text-sm font-medium">
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

const QuickImportSection = ({ form, setForm }: { form: any; setForm: React.Dispatch<React.SetStateAction<any>> }) => (
  <section className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-4 border-b border-[#2a2825] flex justify-between items-center bg-[#161513]">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        Quick Import &amp; Auto-Fill
      </h2>
      <span className="text-xs text-gray-500">AI extracts data from screenshots &amp; URLs</span>
    </div>
    <div className="p-5 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
            Listing URL
            <span className="text-[10px] text-cyan-500 normal-case">Auto-detects platform</span>
          </label>
          <div className="flex">
            <input
              type="text"
              placeholder="https://www.facebook.com/marketplace/item/..."
              value={form.listingUrl}
              onChange={e => setForm(f => ({ ...f, listingUrl: e.target.value }))}
              onPaste={async (e) => {
                // Handle image paste
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const formData = new FormData();
                    formData.append('image', blob);
                    
                    // Call the API to process the image
                    const res = await fetch('/api/process-image', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await res.json();
                    // Update form with processed data
                    setForm(f => ({
                      ...f,
                      vin: data.vin || f.vin,
                      year: data.year || f.year,
                      make: data.make || f.make,
                      model: data.model || f.model,
                      price: data.price || f.price,
                      mileage: data.mileage || f.mileage,
                    }));
                    break;
                  }
                }
              }}
              className="flex-1 bg-[#050403] border border-[#3a3730] rounded-l-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono text-xs"
            />
            <button 
              onClick={async () => {
                const res = await fetch('/api/import-url', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ url: form.listingUrl }),
                });
                const data = await res.json();
                // Update form state with scraped data
                setForm(f => ({
                  ...f,
                  vin: data.vin || f.vin,
                  year: data.year || f.year,
                  make: data.make || f.make,
                  model: data.model || f.model,
                  price: data.price || f.price,
                  mileage: data.mileage || f.mileage,
                }));
              }}
              className="bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-400 px-4 py-2 rounded-r-md text-sm font-medium border border-l-0 border-[#3a3730] transition-colors"
            >
              Scrape
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Quick Reference URL</label>
          <input
            type="url"
            placeholder="Companion URL..."
            value={form.referenceUrl}
            onChange={e => setForm(f => ({ ...f, referenceUrl: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
            Listing Screenshot
            <span className="text-[10px] text-cyan-500 normal-case">Ctrl+V paste enabled</span>
          </label>
          <div className="border-2 border-dashed border-[#3a3730] rounded-lg p-4 text-center hover:border-cyan-800 transition-colors bg-[#0a0905]/50 cursor-pointer flex flex-col items-center justify-center h-24">
            <svg className="w-5 h-5 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-xs text-gray-400">Drop, paste, or <span className="text-cyan-500 font-medium">browse</span> listing screenshot</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
            Vehicle Photos
            <span className="text-[10px] text-gray-500 normal-case">Multi-file</span>
          </label>
          <div className="border-2 border-dashed border-[#3a3730] rounded-lg p-4 text-center hover:border-cyan-800 transition-colors bg-[#0a0905]/50 cursor-pointer flex flex-col items-center justify-center h-24">
            <input type="file" multiple className="hidden" id="photos-upload" />
            <label htmlFor="photos-upload" className="cursor-pointer flex flex-col items-center">
              <div className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="text-xs">Add vehicle photos</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-0.5">JPEG, PNG, WEBP</span>
            </label>
          </div>
        </div>
      </div>
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
        <QuickImportSection form={form} setForm={setForm} />
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

const AIPanel = ({ chatInput, setChatInput, chatMessages, onSendChat }) => {
  const [intelExpanded, setIntelExpanded] = useState(true);

  return (
    <aside className="w-[420px] bg-[#141311] border-l border-[#262420] flex flex-col h-full flex-shrink-0 z-20" style={{ boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#262420] bg-[#1a1816]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </div>
          <span className="font-bold text-sm text-cyan-400 uppercase tracking-widest">VERA AI Active</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">Analysis: Complete</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={customStyles.scrollbarHide}>
        {/* Score Card */}
        <div className="bg-gradient-to-br from-[#1a1816] to-[#161513] border border-[#2a2825] rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-md">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">RECOMMENDED</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-800/50">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">2019 Honda Civic Sport</h3>
              <p className="text-xs text-gray-500">Austin, TX • 84,250 miles</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Asking Price</div>
              <div className="text-lg font-bold text-gray-200">$18,500</div>
            </div>
            <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Market Value</div>
              <div className="text-lg font-bold text-cyan-400">$21,450</div>
            </div>
            <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Instant Equity</div>
              <div className="text-lg font-bold text-emerald-400">+$2,950</div>
            </div>
            <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Issues Found</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-amber-400">3</span>
                <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">Medium</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Trade-In: $16.2k</span>
              <span>Low: $19k</span>
              <span className="text-cyan-400 font-medium">Avg: $21.4k</span>
              <span>High: $24.8k</span>
              <span>Retail: $26.5k</span>
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
            <p className="text-[11px] text-gray-400 mt-2">Asking is <span className="text-emerald-400 font-medium">$2,950 below</span> market average • 42 local comps analyzed</p>
          </div>
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
                <div className="text-xs text-gray-300 bg-[#11100e] p-2 rounded border border-[#2a2825] font-mono">
                  Records found: 14<br />
                  Owners: 2 (Rental, Personal)<br />
                  Last reported miles: 84,202 (11/2023)
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Seller Cross-Reference</div>
                <div className="text-xs text-gray-300 flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>Phone number linked to 4 other current listings (Possible curbstoner/unlicensed dealer).</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Red Flags */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Identified Red Flags (3)
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-red-200 bg-red-900/20 p-2 rounded border border-red-900/40">
              <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"></div>
              Description mentions "AC needs freon" (High probability of compressor failure, est. $1200 repair).
            </li>
            <li className="flex items-start gap-2 text-sm text-red-200 bg-red-900/20 p-2 rounded border border-red-900/40">
              <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"></div>
              Photos show mismatched tires on front/rear.
            </li>
            <li className="flex items-start gap-2 text-sm text-red-200 bg-red-900/20 p-2 rounded border border-red-900/40">
              <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"></div>
              First owner was corporate rental fleet.
            </li>
          </ul>
        </div>

        {/* ROI */}
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Rideshare / ROI Projections
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#11100e] border border-[#2a2825] rounded p-3">
              <div className="text-[10px] text-gray-500 uppercase">Qualifies For</div>
              <div className="text-sm font-medium text-gray-200 mt-1">UberX, Comfort</div>
            </div>
            <div className="bg-[#11100e] border border-[#2a2825] rounded p-3">
              <div className="text-[10px] text-gray-500 uppercase">Est. Monthly Net</div>
              <div className="text-sm font-medium text-green-400 mt-1">+$1,450 / mo</div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">*Based on 35hrs/wk in primary market, deducting est. mpg &amp; maintenance.</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
            <svg className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="text-xs font-medium">Negotiation Script</span>
          </button>
          <button className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
            <svg className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs font-medium">Full Intel Report</span>
          </button>
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleClearForm = () => setForm(defaultForm);

  const handleRunAnalysis = () => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'vera', text: 'Running full AI analysis on the vehicle data provided. Please wait...' }
    ]);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    
    // Stream response from Groq API via /api/chat endpoint
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });
      
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      // Add placeholder message
      setChatMessages(prev => [...prev, { sender: 'vera', text: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        // Update the last message with streaming text
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { sender: 'vera', text: fullResponse };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { sender: 'vera', text: 'Error connecting to VERA AI. Please try again.' }]);
    }
  };

  return (
    <div className="bg-[#0a0905] text-gray-200 h-screen w-full flex overflow-hidden font-sans" style={{ userSelect: 'text' }}>
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
      />
    </div>
  );
};

export default App;