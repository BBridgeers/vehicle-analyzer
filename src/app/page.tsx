"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import type { Vehicle } from '@/lib/types';

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

const HistoryItem = ({ name, price, time, verdict, active, onClick }: { name: string; price: string; time: string; verdict: string; active: boolean; onClick?: () => void }) => {
  const verdictColors: Record<string, string> = {
    Good: 'text-green-400 bg-green-400/10',
    Risk: 'text-red-400 bg-red-400/10',
    Fair: 'text-yellow-400 bg-yellow-400/10',
  };
  return (
    <div onClick={onClick} className={`p-3 ${active ? 'bg-[#1e1c19] border-cyan-800' : 'bg-[#11100e] border-[#262420]'} border rounded-lg cursor-pointer hover:border-cyan-800 transition-colors`}>
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

const Sidebar = ({ history: sidebarHistory }: { history?: Array<{name:string; price:string; time:string; verdict:string; active:boolean}> }) => {
  const [activeHistory, setActiveHistory] = useState(0);

  const displayHistory = sidebarHistory && sidebarHistory.length > 0 ? sidebarHistory : [
    { name: '2019 Toyota RAV4', price: '$22,500', time: '2 hrs ago', verdict: 'Good', active: true },
    { name: '2016 Honda Civic', price: '$14,200', time: 'Yesterday', verdict: 'Risk', active: false },
    { name: '2021 Tesla Model 3', price: '$31,000', time: 'Oct 24', verdict: 'Fair', active: false },
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
        <Link href="/sweeps" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#1a1816] rounded-md text-sm font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Market Sweep
        </Link>
      </nav>

      <div className="flex-1 overflow-y-auto p-4" style={customStyles.scrollbarHide}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Analysis History</h3>
        <div className="space-y-3">
          {displayHistory.map((item, i) => (
            <HistoryItem key={i} {...item} active={i === activeHistory} onClick={() => setActiveHistory(i)} />
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

// ─── Quick Import & Auto-Fill ─────────────────────────────────────────────────
const QuickImportSection = ({ form, setForm, isAnalyzing, onCarfaxResult, onRunAnalysis }: {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  isAnalyzing: boolean;
  onCarfaxResult?: (result: any) => void;
  onRunAnalysis?: () => void;
}) => {
  // ── Listing URL + Scrape ──
  const [listingUrl, setListingUrl] = useState(form.listingUrl || '');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');

  const handleScrape = async () => {
    const url = listingUrl.trim();
    if (!url) return;
    setIsScraping(true);
    setScrapeError('');
    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scrape failed');
      const v = data.vehicle;
      const detectedPlatform = detectPlatform(url);
      setForm((f: any) => ({
        ...f,
        ...v,
        listingUrl: url,
        year: v.year ? String(v.year) : f.year,
        make: v.make || f.make,
        model: v.model || f.model,
        price: v.price ? String(v.price) : f.price,
        mileage: v.mileage ? String(v.mileage) : f.mileage,
        vin: v.vin || f.vin,
        location: v.location || f.location,
        exteriorColor: v.exteriorColor || f.exteriorColor,
        transmission: v.transmission || f.transmission,
        fuelType: v.fuelType || f.fuelType,
        // Remap API field names → form field names
        sellerDescription: v.description || v.sellerDescription || f.sellerDescription,
        platform: detectedPlatform || f.platform,
        seats: v.seatCount ? String(v.seatCount) : (v.seats ? String(v.seats) : f.seats),
        exteriorCondition: v.conditionExterior || v.exteriorCondition || f.exteriorCondition,
        interiorCondition: v.conditionInterior || v.interiorCondition || f.interiorCondition,
        postedDate: v.postedDate || f.postedDate,
      }));
      // Auto-trigger AI analysis after URL scrape completes
      // Use ref to get the latest onRunAnalysis with fresh form state
      setTimeout(() => onRunAnalysisRef.current?.(), 400);
    } catch (e: any) {
      setScrapeError(e.message);
    } finally {
      setIsScraping(false);
    }
  };

  // ── Screenshot Paste/Drop ──
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotStatus, setScreenshotStatus] = useState<'idle'|'extracting'|'done'|'error'>('idle');
  const [screenshotError, setScreenshotError] = useState('');
  const [isDraggingShot, setIsDraggingShot] = useState(false);
  const shotDragCounter = useRef(0);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Ref to always hold latest onRunAnalysis, avoiding stale closures in timeouts
  const onRunAnalysisRef = useRef(onRunAnalysis);
  onRunAnalysisRef.current = onRunAnalysis;

  // Auto-detect platform name from listing URL
  const detectPlatform = (url: string): string => {
    if (!url) return '';
    const u = url.toLowerCase();
    if (u.includes('facebook.com') || u.includes('fb.com')) return 'Facebook Marketplace';
    if (u.includes('craigslist.org') || u.includes('craigslist.com')) return 'Craigslist';
    if (u.includes('autotempest.com')) return 'AutoTempest';
    if (u.includes('cars.com')) return 'Cars.com';
    if (u.includes('cargurus.com')) return 'CarGurus';
    if (u.includes('autotrader.com')) return 'Autotrader';
    if (u.includes('offerup.com')) return 'OfferUp';
    if (u.includes('carvana.com')) return 'Carvana';
    if (u.includes('carmax.com')) return 'CarMax';
    if (u.includes('truecar.com')) return 'TrueCar';
    if (u.includes('ebay.com')) return 'eBay Motors';
    return 'Other';
  };

  // Resize image client-side to avoid Vercel 4.5 MB body limit.
  // Max dimension 1920px (more than enough for vision extraction),
  // JPEG quality 0.75 — brings 8 MB PNGs down to ~300 KB.
  const resizeImage = (file: File, maxDim: number = 1920): Promise<Blob> =>
    new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        // Safety timeout — if image doesn't load in 10s, abort
        const timeout = setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Image load timed out (10s). The image may be too large or corrupt.'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          try {
            let { width, height } = img;
            // Guard against zero-dimension images
            if (width < 1 || height < 1) {
              return reject(new Error('Invalid image dimensions'));
            }
            // Scale down if needed
            if (width > height) {
              if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
            } else {
              if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context unavailable (browser may have restricted canvas access)'));
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              blob => {
                if (blob && blob.size > 0) {
                  resolve(blob);
                } else {
                  reject(new Error('Canvas produced empty blob — browser may not support toBlob'));
                }
              },
              'image/jpeg',
              0.75
            );
          } catch (drawErr: any) {
            reject(new Error('Canvas processing failed: ' + (drawErr.message || 'unknown')));
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Image load failed — the image format may not be supported by your browser'));
        };
        
        img.src = objectUrl;
      } catch (initErr: any) {
        reject(new Error('Image processing init failed: ' + (initErr.message || 'unknown')));
      }
    });

  const processScreenshot = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setScreenshotPreview(previewUrl);
    setScreenshotStatus('extracting');
    setScreenshotError('');
    try {
      // Resize to reasonable dimensions for vision (saves bandwidth, avoids Vercel limits)
      const blob = await resizeImage(file, 1920);
      const formData = new FormData();
      formData.append('image', blob, 'screenshot.jpg');
      if (listingUrl.trim()) formData.append('manualUrl', listingUrl.trim());
      const res = await fetch('/api/extract-listing', {
        method: 'POST',
        // Content-Type set automatically by browser for FormData (multipart boundary)
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      const v = data.vehicle;
      // Detect platform from extracted URL
      const detectedPlatform = detectPlatform(v.listingUrl || listingUrl);
      setForm((f: any) => ({
        ...f,
        ...v,
        price: v.price ? String(v.price) : f.price,
        mileage: v.mileage ? String(v.mileage) : f.mileage,
        year: v.year ? String(v.year) : f.year,
        // Remap API field names → form field names
        sellerDescription: v.description || v.sellerDescription || f.sellerDescription,
        platform: detectedPlatform || v.platform || f.platform,
        seats: v.seatCount ? String(v.seatCount) : (v.seats ? String(v.seats) : f.seats),
        exteriorCondition: v.conditionExterior || v.exteriorCondition || f.exteriorCondition,
        interiorCondition: v.conditionInterior || v.interiorCondition || f.interiorCondition,
        postedDate: v.postedDate || f.postedDate,
      }));
      setScreenshotStatus('done');
      // Auto-trigger AI analysis after fields are extracted
      // Use ref to get the latest onRunAnalysis with fresh form state
      setTimeout(() => onRunAnalysisRef.current?.(), 400);
    } catch (e: any) {
      const msg = e.message || 'Unknown error';
      if (msg === 'Failed to fetch' || msg.includes('NetworkError'))
        setScreenshotError('Network error — check your connection and try again.');
      else if (msg.includes('Image load failed'))
        setScreenshotError('Could not read the image from clipboard. Try saving the screenshot as a file and using Browse instead.');
      else if (msg.includes('Canvas encode failed'))
        setScreenshotError('Image processing failed. Try a different image format (PNG/JPG).');
      else
        setScreenshotError(msg);
      setScreenshotStatus('error');
    }
  }, [listingUrl, setForm]);

  // Global paste handler for screenshots
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (screenshotStatus === 'extracting') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processScreenshot(file);
          return;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [screenshotStatus, processScreenshot]);

  const clearScreenshot = () => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
    setScreenshotStatus('idle');
    setScreenshotError('');
  };

  // ── Vehicle Photos (multi-file) ──
  const [photos, setPhotos] = useState<{file: File; preview: string}[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoDragCounter = useRef(0);

  const addPhotos = (files: FileList | File[]) => {
    const valid = ['image/jpeg','image/png','image/webp'];
    const newPhotos: {file: File; preview: string}[] = [];
    Array.from(files).forEach(f => {
      if (valid.includes(f.type) && photos.length + newPhotos.length < 10)
        newPhotos.push({ file: f, preview: URL.createObjectURL(f) });
    });
    setPhotos(p => [...p, ...newPhotos]);
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photos[i].preview);
    setPhotos(p => p.filter((_, idx) => idx !== i));
  };

  // ── CARFAX Report Upload ──
  const [carfaxFile, setCarfaxFile] = useState<File | null>(null);
  const [carfaxStatus, setCarfaxStatus] = useState<'idle'|'parsing'|'done'|'error'>('idle');
  const [carfaxError, setCarfaxError] = useState('');
  const [carfaxResult, setCarfaxResult] = useState<any>(null);
  const [isDraggingCarfax, setIsDraggingCarfax] = useState(false);
  const carfaxDragCounter = useRef(0);
  const carfaxInputRef = useRef<HTMLInputElement>(null);

  // ── Client-side PDF page renderer (no server deps needed) ────────────────
  const renderPdfPagesToJpeg = async (file: File): Promise<string[]> => {
    // Load pdf.js from CDN if not already loaded
    if (!(window as any).pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load PDF renderer'));
        document.head.appendChild(script);
      });
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const pdfjsLib = (window as any).pdfjsLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    const maxPages = Math.min(pdf.numPages, 12);
    const canvas = document.createElement('canvas');

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      // Strip data: prefix — backend expects raw base64
      pages.push(canvas.toDataURL('image/jpeg', 0.75).split(',')[1]);
    }

    return pages;
  };

  const processCarfax = async (file: File) => {
    setCarfaxFile(file);
    setCarfaxStatus('parsing');
    setCarfaxError('');
    setCarfaxResult(null);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch('/api/analyze-carfax', { method: 'POST', body: formData });
      const data = await res.json();

      // If text extraction failed (image-based PDF), render pages client-side
      if (!res.ok && data.needsVision) {
        setCarfaxError('Image-based PDF — rendering pages for AI vision...');
        const pages = await renderPdfPagesToJpeg(file);
        const visionFormData = new FormData();
        visionFormData.append('pages', JSON.stringify(pages));
        visionFormData.append('filename', file.name);
        const visionRes = await fetch('/api/analyze-carfax', { method: 'POST', body: visionFormData });
        const visionData = await visionRes.json();
        if (!visionRes.ok) throw new Error(visionData.error || 'Vision analysis failed');
        setCarfaxResult(visionData);
        setCarfaxStatus('done');
        if (onCarfaxResult) onCarfaxResult(visionData);
        if (visionData.titleStatus) setForm((f: any) => ({ ...f, titleStatus: visionData.titleStatus }));
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setCarfaxResult(data);
      setCarfaxStatus('done');
      if (onCarfaxResult) onCarfaxResult(data);
      // Auto-fill title status if CARFAX reveals it
      if (data.titleStatus) setForm((f: any) => ({ ...f, titleStatus: data.titleStatus }));
    } catch (e: any) {
      setCarfaxError(e.message);
      setCarfaxStatus('error');
    }
  };

  const clearCarfax = () => { setCarfaxFile(null); setCarfaxStatus('idle'); setCarfaxError(''); setCarfaxResult(null); };

  return (
    <section className="mb-6">
      <div className="bg-[#131210] border border-[#2a2825] rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#2a2825] bg-[#161513] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-200">Quick Import &amp; Auto-Fill</h2>
          </div>
          <span className="text-[10px] text-gray-500">AI extracts data from screenshots &amp; URLs</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Row 1: Listing URL + Scrape | Quick Reference URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Listing URL */}
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                Listing URL
                <span className="ml-1.5 text-cyan-500 normal-case font-normal">Auto-detects platform</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="listing-url-input"
                  type="url"
                  value={listingUrl}
                  onChange={e => { setListingUrl(e.target.value); setForm((f: any) => ({ ...f, listingUrl: e.target.value })); setScrapeError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleScrape()}
                  placeholder="https://www.facebook.com/marketplace/item/..."
                  className="flex-1 min-w-0 bg-[#050403] border border-[#3a3730] rounded-l-md px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                />
                <button
                  onClick={handleScrape}
                  disabled={!listingUrl.trim() || isScraping}
                  className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-r-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  id="scrape-btn"
                >
                  {isScraping ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  {isScraping ? 'Scraping...' : 'Scrape'}
                </button>
              </div>
              {scrapeError && <p className="mt-1 text-[10px] text-red-400">{scrapeError}</p>}
            </div>

            {/* Quick Reference URL */}
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Quick Reference URL</label>
              <input
                id="reference-url-input"
                type="url"
                value={form.referenceUrl || ''}
                onChange={e => setForm((f: any) => ({ ...f, referenceUrl: e.target.value }))}
                placeholder="Comparison URL..."
                className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3a3730] focus:ring-1 focus:ring-gray-700"
              />
            </div>
          </div>

          {/* Row 2: Screenshot Dropzone | Vehicle Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Listing Screenshot */}
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                Listing Screenshot
                <span className="ml-1.5 text-cyan-500 normal-case font-normal">Ctrl+V paste enabled</span>
              </label>
              <div
                onDragEnter={e => { e.preventDefault(); shotDragCounter.current += 1; setIsDraggingShot(true); }}
                onDragLeave={e => { e.preventDefault(); shotDragCounter.current -= 1; if (shotDragCounter.current === 0) setIsDraggingShot(false); }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); shotDragCounter.current = 0; setIsDraggingShot(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) processScreenshot(f); }}
                onClick={() => screenshotStatus === 'idle' && screenshotInputRef.current?.click()}
                className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden
                  ${ isDraggingShot ? 'border-cyan-500 bg-cyan-500/5' : screenshotStatus === 'idle' ? 'border-[#3a3730] hover:border-cyan-700 hover:bg-[#1a1816]' : 'border-transparent' }`}
                style={{ minHeight: '90px' }}
              >
                <input ref={screenshotInputRef} type="file" accept="image/*" className="hidden" id="screenshot-input" title="Upload listing screenshot" onChange={e => { const f = e.target.files?.[0]; if (f) processScreenshot(f); }} />

                {screenshotStatus === 'idle' && (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-5 text-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-xs text-gray-500">Drop, paste or <span className="text-cyan-500 underline">browse</span> listing screenshot</p>
                  </div>
                )}

                {screenshotPreview && screenshotStatus !== 'idle' && (
                  <div className="relative">
                    <img src={screenshotPreview} alt="Listing" className={`w-full max-h-[110px] object-cover transition-all ${ screenshotStatus === 'extracting' ? 'opacity-40 blur-[1px]' : '' }`} />
                    {screenshotStatus === 'extracting' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <svg className="w-6 h-6 text-cyan-400 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        <span className="ml-2 text-white text-xs">Extracting...</span>
                      </div>
                    )}
                    {screenshotStatus === 'done' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span className="ml-2 text-emerald-300 text-xs font-semibold">Fields extracted!</span>
                      </div>
                    )}
                    {screenshotStatus === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="text-red-300 text-xs px-2 text-center">{screenshotError}</span>
                      </div>
                    )}
                    {screenshotStatus !== 'extracting' && (
                      <button onClick={e => { e.stopPropagation(); clearScreenshot(); }} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black text-xs" title="Clear">
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Photos - Multi-file */}
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                Vehicle Photos <span className="text-gray-500 normal-case font-normal">Multi-file</span>
              </label>
              <div
                onDragEnter={e => { e.preventDefault(); photoDragCounter.current += 1; setIsDraggingPhoto(true); }}
                onDragLeave={e => { e.preventDefault(); photoDragCounter.current -= 1; if (photoDragCounter.current === 0) setIsDraggingPhoto(false); }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); photoDragCounter.current = 0; setIsDraggingPhoto(false); if (e.dataTransfer.files.length) addPhotos(e.dataTransfer.files); }}
                onClick={() => photoInputRef.current?.click()}
                className={`rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden
                  ${ isDraggingPhoto ? 'border-cyan-500 bg-cyan-500/5' : 'border-[#3a3730] hover:border-cyan-700 hover:bg-[#1a1816]' }`}
                style={{ minHeight: '90px' }}
              >
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" id="vehicle-photos-input" title="Upload vehicle photos" onChange={e => { if (e.target.files) addPhotos(e.target.files); e.target.value = ''; }} />

                {photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-5 text-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                    <p className="text-xs text-gray-500">+ Add vehicle photos</p>
                    <p className="text-[10px] text-gray-600">JPEG, PNG, WEBP</p>
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="grid grid-cols-5 gap-1 mb-1.5">
                      {photos.map((ph, i) => (
                        <div key={i} className="relative group aspect-square rounded overflow-hidden border border-[#3a3730]">
                          <img src={ph.preview} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                          <button onClick={e => { e.stopPropagation(); removePhoto(i); }} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px]" title="Remove">✕</button>
                        </div>
                      ))}
                      {photos.length < 10 && (
                        <div className="aspect-square rounded border-2 border-dashed border-[#3a3730] flex items-center justify-center text-gray-600 hover:border-cyan-700">
                          <span className="text-lg">+</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 text-center">{photos.length}/10 photos</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: CARFAX Report Upload */}
          <div>
            <label className="block text-[10px] font-medium text-amber-400 uppercase tracking-widest mb-1.5">
              CARFAX Report
              <span className="ml-1.5 text-gray-500 normal-case font-normal">Upload PDF — AI generates full buying recommendation</span>
            </label>
            <div
              onDragEnter={e => { e.preventDefault(); e.stopPropagation(); carfaxDragCounter.current += 1; setIsDraggingCarfax(true); }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); carfaxDragCounter.current -= 1; if (carfaxDragCounter.current === 0) setIsDraggingCarfax(false); }}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation();
                carfaxDragCounter.current = 0; setIsDraggingCarfax(false);
                const f = e.dataTransfer.files[0];
                // Windows Explorer drag often gives empty type — accept by extension too
                const isPdf = f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                if (isPdf) processCarfax(f);
                else if (f) setCarfaxError('Please drop a PDF file. Got: ' + (f.name || 'unknown'));
              }}
              onClick={() => carfaxInputRef.current?.click()}
              className={`rounded-lg border-2 border-dashed transition-all overflow-hidden
                ${ isDraggingCarfax ? 'border-amber-500 bg-amber-500/5 cursor-copy'
                  : carfaxStatus === 'idle' ? 'border-[#3a3730] hover:border-amber-700 hover:bg-[#1c1810] cursor-pointer'
                  : carfaxStatus === 'done' ? 'border-emerald-800/50 cursor-pointer'
                  : 'border-transparent cursor-default' }`}
              id="carfax-dropzone"
            >
              <input ref={carfaxInputRef} type="file" accept="application/pdf" className="hidden" id="carfax-input" title="Upload CARFAX Report PDF" onChange={e => { const f = e.target.files?.[0]; if (f) processCarfax(f); e.target.value = ''; }} />

              {carfaxStatus === 'idle' && (
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-900/20 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-300">Drop CARFAX PDF here or click to browse</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Includes rebuilt title analysis, accident severity, owner history &amp; buy/skip recommendation</p>
                  </div>
                </div>
              )}

              {carfaxStatus === 'parsing' && (
                <div className="flex items-center gap-3 p-4">
                  <svg className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  <div>
                    <p className="text-xs font-medium text-amber-300">{carfaxFile?.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Groq AI is reading the report...</p>
                  </div>
                </div>
              )}

              {carfaxStatus === 'error' && (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-xs text-red-300">{carfaxError}</p>
                  </div>
                  <button onClick={clearCarfax} className="text-[10px] text-gray-500 hover:text-white underline ml-4">Try again</button>
                </div>
              )}

              {carfaxStatus === 'done' && carfaxResult && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-xs font-semibold text-emerald-300">CARFAX Analyzed: {carfaxFile?.name}</span>
                    </div>
                    <button onClick={clearCarfax} className="text-[10px] text-gray-500 hover:text-white">✕ Clear</button>
                  </div>

                  {/* Verdict badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border
                    ${ carfaxResult.verdict === 'BUY' ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                      : carfaxResult.verdict === 'SKIP' ? 'bg-red-900/30 border-red-700/50 text-red-300'
                      : 'bg-amber-900/30 border-amber-700/50 text-amber-300' }`}>
                    { carfaxResult.verdict === 'BUY' ? '✅' : carfaxResult.verdict === 'SKIP' ? '🚫' : '⚠️' }
                    {carfaxResult.verdict} — {carfaxResult.verdictReason}
                  </div>

                  {/* Key facts grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                    {carfaxResult.owners && <div className="bg-[#0a0905] border border-[#2a2825] rounded px-2 py-1.5"><div className="text-gray-500 mb-0.5">Owners</div><div className="text-gray-200 font-semibold">{carfaxResult.owners}</div></div>}
                    {carfaxResult.incidents && carfaxResult.incidents.length > 0 && <div className="bg-[#0a0905] border border-[#2a2825] rounded px-2 py-1.5"><div className="text-gray-500 mb-0.5">Incidents</div><div className="text-amber-300 font-semibold">{carfaxResult.incidents.length}</div></div>}
                    {carfaxResult.titleStatus && <div className="bg-[#0a0905] border border-[#2a2825] rounded px-2 py-1.5"><div className="text-gray-500 mb-0.5">Title</div><div className={`font-semibold ${ carfaxResult.titleStatus === 'Clean' ? 'text-emerald-300' : 'text-orange-300' }`}>{carfaxResult.titleStatus}</div></div>}
                    {carfaxResult.serviceRecordCount != null && <div className="bg-[#0a0905] border border-[#2a2825] rounded px-2 py-1.5"><div className="text-gray-500 mb-0.5">Service Recs</div><div className="text-gray-200 font-semibold">{carfaxResult.serviceRecordCount}</div></div>}
                  </div>

                  {/* Summary */}
                  {carfaxResult.summary && (
                    <p className="text-[10px] text-gray-400 leading-relaxed border-t border-[#2a2825] pt-2">{carfaxResult.summary}</p>
                  )}

                  {/* Red flags */}
                  {carfaxResult.redFlags?.length > 0 && (
                    <div className="space-y-1">
                      {carfaxResult.redFlags.map((flag: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-red-300">
                          <span className="mt-0.5 text-red-500">▸</span>{flag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CoreIdentitySection = ({ form, setForm }) => {
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState('');
  const [vinResult, setVinResult] = useState<any>(null);

  const handleVinDecode = async () => {
    const vin = form.vin?.trim();
    if (!vin || vin.length < 11) {
      setVinError('Enter a valid 17-character VIN');
      return;
    }
    setVinDecoding(true);
    setVinError('');
    setVinResult(null);
    try {
      const res = await fetch('/api/vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'VIN decode failed');
      setVinResult(data);
      // Auto-fill form fields from decode result
      if (data.specs) {
        setForm((f: any) => ({
          ...f,
          year: data.specs.year && data.specs.year !== 'Unknown' ? String(data.specs.year) : f.year,
          make: data.specs.make && data.specs.make !== 'Unknown' ? data.specs.make : f.make,
          model: data.specs.model && data.specs.model !== 'Unknown' ? data.specs.model : f.model,
          trim: data.specs.trim || f.trim,
        }));
      }
    } catch (e: any) {
      setVinError(e.message);
    } finally {
      setVinDecoding(false);
    }
  };

  return (
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
          <button
            onClick={handleVinDecode}
            disabled={vinDecoding || !form.vin}
            className="bg-[#1e1c19] hover:bg-[#2a2825] disabled:opacity-40 disabled:cursor-not-allowed text-cyan-400 px-4 py-2 rounded-r-md text-sm font-medium border border-l-0 border-[#3a3730] transition-colors flex items-center gap-1"
          >
            {vinDecoding ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            {vinDecoding ? 'Decoding...' : 'Decode'}
          </button>
        </div>
        {vinError && <p className="text-xs text-red-400 mt-1">{vinError}</p>}
        {vinResult && !vinError && (
          <div className="mt-2 flex flex-wrap gap-2">
            {vinResult.specs?.year && vinResult.specs.year !== 'Unknown' && <span className="text-[10px] bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 px-2 py-0.5 rounded">{vinResult.specs.year} {vinResult.specs.make} {vinResult.specs.model}</span>}
            {vinResult.verdict && <span className={`text-[10px] px-2 py-0.5 rounded border ${vinResult.verdict.score >= 75 ? 'bg-emerald-900/30 border-emerald-700/40 text-emerald-300' : vinResult.verdict.score >= 50 ? 'bg-amber-900/30 border-amber-700/40 text-amber-300' : 'bg-red-900/30 border-red-700/40 text-red-300'}`}>Score: {vinResult.verdict.score} — {vinResult.verdict.recommendation}</span>}
            {vinResult.safety?.recalls?.length > 0 && <span className="text-[10px] bg-red-900/30 border border-red-700/40 text-red-300 px-2 py-0.5 rounded">⚠ {vinResult.safety.recalls.length} recalls</span>}
          </div>
        )}
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
};

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
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Mechanical / Issues</label>
          <textarea
            rows={3}
            placeholder="Engine noises, warning lights, maintenance history, tire tread..."
            value={form.mechanicalCondition}
            onChange={e => setForm(f => ({ ...f, mechanicalCondition: e.target.value }))}
            className="w-full bg-[#050403] border border-[#3a3730] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-none"
          />
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-[#2a2825]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Additional Photos & Visual Evidence</h3>
            <p className="text-xs text-gray-500">Upload listing photos for interior/exterior condition and red flag analysis</p>
          </div>
          <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50 uppercase tracking-widest font-mono">Vision AI Scan</span>
        </div>
        <ImageUploader onUpload={(data) => setForm((f: any) => ({ ...f, ...data }))} isLoading={false} />
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
            onClick={onRunAnalysis}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ boxShadow: '0 0 15px rgba(8,145,178,0.3)' }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
      </div>
    </header>

    <div className="flex-1 overflow-y-auto p-8" style={customStyles.scrollbarHide}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <QuickImportSection form={form} setForm={setForm} isAnalyzing={isAnalyzing} onRunAnalysis={onRunAnalysis} />
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

const AIPanel = ({ chatInput, setChatInput, chatMessages, onSendChat, onSaveToFleet, isSaved, analysisResult, form, chatExpanded, onNegotiationScript, onFullIntelReport, onToggleChat }: any) => {
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
          <button onClick={onNegotiationScript} className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
            <svg className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="text-xs font-medium">Negotiation Script</span>
          </button>
          <button onClick={onFullIntelReport} className="bg-[#1e1c19] hover:bg-[#2a2825] border border-[#3a3730] text-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
            <svg className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs font-medium">Full Intel Report</span>
          </button>
        </div>

        {/* Intel Data — real analysis sections */}
        {analysisResult ? (
        <>
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Market Values</h3>
          </div>
          <div className="p-4 space-y-2">
            {analysisResult.marketValues ? (
              <>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Trade-In</span><span className="text-gray-200 font-medium">${(analysisResult.marketValues.tradeIn || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Private Party</span><span className="text-gray-200 font-medium">${(analysisResult.marketValues.privateParty || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Dealer Retail</span><span className="text-gray-200 font-medium">${(analysisResult.marketValues.dealerRetail || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs border-t border-[#262420] pt-2 mt-1">
                  <span className="text-gray-500">Instant Equity</span>
                  <span className={`font-bold ${(analysisResult.instantEquity ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(analysisResult.instantEquity ?? 0) >= 0 ? '+' : ''}${Math.abs(analysisResult.instantEquity ?? 0).toLocaleString()}
                  </span>
                </div>
              </>
            ) : <p className="text-xs text-gray-600">Run analysis to see market values</p>}
          </div>
        </div>

        {analysisResult.rideshare && (
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Rideshare Earnings</h3>
          </div>
          <div className="p-4 space-y-2">
            {analysisResult.rideshare.uberXL?.eligible && <div className="text-[10px] text-cyan-400 font-bold mb-1">✓ UBER XL ELIGIBLE</div>}
            {analysisResult.rideshare.uberComfort?.eligible && !analysisResult.rideshare.uberXL?.eligible && <div className="text-[10px] text-cyan-400 font-bold mb-1">✓ UBER COMFORT ELIGIBLE</div>}
            {analysisResult.rideshare.weeklyGross ? (
              <>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Weekly Gross</span><span className="text-emerald-400 font-bold">${analysisResult.rideshare.weeklyGross.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Weekly Net</span><span className="text-gray-200">${(analysisResult.rideshare.weeklyNet || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Monthly Net</span><span className="text-gray-200 font-bold">${((analysisResult.rideshare.weeklyNet || 0) * 4.33).toFixed(0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Annual Net</span><span className="text-gray-200">${((analysisResult.rideshare.weeklyNet || 0) * 52).toLocaleString()}</span></div>
              </>
            ) : <p className="text-xs text-gray-600">Vehicle may not qualify for rideshare</p>}
          </div>
        </div>
        )}

        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Operational Costs &amp; Break-Even</h3>
          </div>
          <div className="p-4 space-y-2">
            {analysisResult.operationalCosts ? (
              <>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Fuel/Mo</span><span className="text-gray-200">${(analysisResult.operationalCosts.fuelMonthly || 0).toFixed(0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Maintenance/Mo</span><span className="text-gray-200">${(analysisResult.operationalCosts.maintenanceMonthly || 0).toFixed(0)}</span></div>
                {analysisResult.insurance?.monthly ? <div className="flex justify-between text-xs"><span className="text-gray-500">Insurance/Mo</span><span className="text-gray-200">${analysisResult.insurance.monthly.toFixed(0)}</span></div> : null}
                <div className="flex justify-between text-xs"><span className="text-gray-500">Depreciation/Mo</span><span className="text-gray-200">${(analysisResult.operationalCosts.depreciationMonthly || 0).toFixed(0)}</span></div>
                <div className="flex justify-between text-xs border-t border-[#262420] pt-2 mt-1">
                  <span className="text-gray-400 font-bold">Total Monthly OpEx</span>
                  <span className="text-gray-100 font-bold">${(analysisResult.operationalCosts.totalMonthly || 0).toFixed(0)}</span>
                </div>
                {analysisResult.breakEven ? (
                  <div className="flex justify-between text-xs border-t border-[#262420] pt-2 mt-1">
                    <span className="text-gray-500">Break-Even</span>
                    <span className="text-cyan-400 font-bold">{analysisResult.breakEven.weeks || analysisResult.breakEven} weeks</span>
                  </div>
                ) : null}
                {analysisResult.paybackWeeks ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ROI Payback</span>
                    <span className="text-emerald-400 font-bold">{analysisResult.paybackWeeks} weeks</span>
                  </div>
                ) : null}
              </>
            ) : <p className="text-xs text-gray-600">Run analysis to see costs</p>}
          </div>
        </div>

        {analysisResult.initialInvestment && (
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Initial Investment</h3>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Down Payment</span><span className="text-gray-200">${(analysisResult.initialInvestment.downPayment || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Tax &amp; Title</span><span className="text-gray-200">${(analysisResult.initialInvestment.taxTitleFees || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Warranty</span><span className="text-gray-200">${(analysisResult.initialInvestment.warranty || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs border-t border-[#262420] pt-2 mt-1">
              <span className="text-gray-400 font-bold">Total OTD</span>
              <span className="text-gray-100 font-bold">${(analysisResult.initialInvestment.totalOTD || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        )}

        {analysisResult.scenarios && Object.keys(analysisResult.scenarios).length > 0 && (
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Scenarios (12-Month)</h3>
          </div>
          <div className="p-4 space-y-3">
            {analysisResult.scenarios.best && (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
                <div className="text-[10px] text-emerald-400 font-bold mb-1">BEST CASE</div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Net Income</span><span className="text-emerald-300">${(analysisResult.scenarios.best.netIncome || 0).toLocaleString()}</span></div>
              </div>
            )}
            {analysisResult.scenarios.expected && (
              <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-3">
                <div className="text-[10px] text-cyan-400 font-bold mb-1">EXPECTED</div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Net Income</span><span className="text-cyan-300">${(analysisResult.scenarios.expected.netIncome || 0).toLocaleString()}</span></div>
              </div>
            )}
            {analysisResult.scenarios.worst && (
              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                <div className="text-[10px] text-red-400 font-bold mb-1">WORST CASE</div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Net Income</span><span className="text-red-300">${(analysisResult.scenarios.worst.netIncome || 0).toLocaleString()}</span></div>
              </div>
            )}
          </div>
        </div>
        )}
        </>
        ) : (
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="p-5 text-center">
            <p className="text-xs text-gray-500">No analysis data yet.</p>
            <p className="text-[10px] text-gray-600 mt-1">Click "Run AI Analysis" or "Generate VERA Intelligence Report" to begin</p>
          </div>
        </div>
        )}

        {/* Red Flags — from real data */}
        {analysisResult?.criticalIssues && analysisResult.criticalIssues.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Critical Issues ({analysisResult.criticalIssues.length})
          </h3>
          <ul className="space-y-2">
            {analysisResult.criticalIssues.map((issue: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-200">
                <div className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-red-500"></div>
                <span>{typeof issue === 'string' ? issue : (issue.title || issue.concern || issue.description || issue)}</span>
              </li>
            ))}
          </ul>
        </div>
        )}

        {/* VIN Snippet — keep for quick glance */}
        {form.vin && (
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">VIN Decode</h3>
          </div>
          <div className="p-4">
            <div className="text-xs text-gray-300 bg-[#11100e] p-2 rounded border border-[#2a2825] font-mono">
              <div className="text-cyan-400">{form.vin}</div>
              {form.year && form.make && form.model && <div className="mt-1 text-gray-500">{form.year} {form.make} {form.model} {form.trim}</div>}
            </div>
          </div>
        </div>
        )}

        {/* Action Plan */}
        {analysisResult?.actionPlan && analysisResult.actionPlan.length > 0 && (
        <div className="bg-[#1a1816] border border-[#2a2825] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1e1c19]">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Action Plan
            </h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {analysisResult.actionPlan.map((step: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-900/50 border border-emerald-800 text-[9px] text-emerald-400 flex items-center justify-center font-bold">{i + 1}</div>
                  <span>{typeof step === 'string' ? step : (step.action || step.step || step)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        )}
      </div>

      {/* Chat */}
      <div className="h-64 border-t border-[#262420] bg-[#0a0905] flex flex-col flex-shrink-0 relative">
        <div className="px-4 py-2 border-b border-[#262420] bg-[#11100e] flex justify-between items-center">
          <span className="text-xs font-semibold text-cyan-500">Ask VERA</span>
          <button onClick={onToggleChat} className="text-gray-500 hover:text-white">
            <svg className={`w-4 h-4 transition-transform ${chatExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        {chatExpanded && (
        <>
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
        </>
        )}
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [history, setHistory] = useState<Array<{name:string; price:string; time:string; verdict:string; active:boolean}>>([]);

  // Update analysis history whenever a new result comes in
  useEffect(() => {
    if (!analysisResult) return;
    const entry = {
      name: `${form.year || '?'} ${form.make || '?'} ${form.model || 'Vehicles'}`,
      price: `$${Number(form.price || 0).toLocaleString()}`,
      time: 'Just now',
      verdict: analysisResult.badge || 'Fair',
      active: true,
    };
    setHistory(prev => {
      // Deduplicate by name + price
      const exists = prev.some(h => h.name === entry.name && h.price === entry.price);
      if (exists) return prev;
      return [entry, ...prev.map(h => ({...h, active: false}))].slice(0, 20);
    });
  }, [analysisResult, form.make, form.model, form.price, form.year]);

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
        // ── Build Vehicle object from form state ──
        const vehicle: Vehicle = {
            year: parseInt(form.year) || new Date().getFullYear(),
            make: form.make,
            model: form.model,
            price: parseFloat(form.price) || 0,
            mileage: parseFloat(form.mileage) || 0,
            vin: form.vin || undefined,
            location: form.location || undefined,
            titleStatus: form.titleStatus || undefined,
            seats: parseInt(form.seats) || undefined,
            exteriorColor: form.exteriorColor || undefined,
            interiorColor: form.interiorColor || undefined,
            transmission: form.transmission || undefined,
            fuelType: form.fuelType || undefined,
            listingUrl: form.listingUrl || undefined,
            description: form.sellerDescription || undefined,
            postedDate: form.postedDate || undefined,
            conditionExterior: form.exteriorCondition || undefined,
            conditionInterior: form.interiorCondition || undefined,
            conditionMechanical: form.mechanicalCondition || undefined,
            sellerResponsiveness: (form.communication as any) || undefined,
            sellerTransparency: (form.transparency as any) || undefined,
            sellerRedFlags: form.redFlags || undefined,
            sellerQuotes: form.sellerQuotes || undefined,
        };

        // ── Dynamic import to avoid SSR issues ──
        const { analyzeVehicle } = await import('@/lib/analyze');
        const result = analyzeVehicle(vehicle);

        // ── Map to UI format ──
        const score = result.verdictScore;
        const equity = result.instantEquity;
        const badgeMap: Record<string, string> = {
            '🔥 STRONG BUY': 'Strong Buy',
            '✅ RECOMMENDED': 'Recommended',
            '⚠️ PROCEED WITH CAUTION': 'Fair Deal',
            '🚫 AVOID': 'Risky',
        };
        const scoreColorMap: Record<string, string> = {
            '🔥 STRONG BUY': 'text-emerald-500',
            '✅ RECOMMENDED': 'text-emerald-400',
            '⚠️ PROCEED WITH CAUTION': 'text-yellow-400',
            '🚫 AVOID': 'text-red-500',
        };
        const badgeClassMap: Record<string, string> = {
            '🔥 STRONG BUY': 'bg-emerald-500 text-[#0a0905]',
            '✅ RECOMMENDED': 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30',
            '⚠️ PROCEED WITH CAUTION': 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30',
            '🚫 AVOID': 'bg-red-600/30 text-red-300 border border-red-500/30',
        };

        const analysisResult = {
            // Core display
            score,
            equity: equity >= 0 ? `+$${equity.toLocaleString()}` : `-$${Math.abs(equity).toLocaleString()}`,
            opex: `$${(result.operationalCosts?.totalMonthly ?? 0).toFixed(0)}`,
            badge: badgeMap[result.verdict] || 'Fair Deal',
            badgeClass: badgeClassMap[result.verdict] || 'bg-cyan-600 text-white',
            scoreColor: scoreColorMap[result.verdict] || 'text-cyan-400',
            // Full analysis data for reports/exports/history
            fullAnalysis: result,
            marketValues: result.marketValues,
            criticalIssues: result.criticalIssues,
            rideshare: result.rideshare,
            insurance: result.insurance,
            verdict: result.verdict,
            instantEquity: result.instantEquity,
            verdictScore: result.verdictScore,
            scenarios: result.scenarios,
            breakEven: result.breakEven,
            operationalCosts: result.operationalCosts,
            initialInvestment: result.initialInvestment,
            paybackWeeks: result.paybackWeeks,
            actionPlan: result.actionPlan,
            negotiation: result.negotiation,
            structuredVerdict: result.structuredVerdict,
            conditionAssessment: result.conditionAssessment,
            sellerVerification: result.sellerVerification,
            scoringBreakdown: result.scoringBreakdown,
        };

        setAnalysisResult(analysisResult);

        // ── Also try AI-powered insight via chat API ──
        try {
            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', parts: [{ text: `You just analyzed: ${vehicle.year} ${vehicle.make} ${vehicle.model} | Price: $${vehicle.price.toLocaleString()} | Mileage: ${vehicle.mileage.toLocaleString()} | VERA Score: ${score}/100 | Verdict: ${result.verdict} | Equity: ${equity >= 0 ? '+' : ''}$${equity.toLocaleString()}. Give a brief, insightful AI summary in 2-3 sentences.` }] }],
                    systemPrompt: 'You are VERA, an AI vehicle analyst. Summarize key findings concisely.' 
                }),
            });
            if (chatRes.ok) {
                const reader = chatRes.body?.getReader();
                const decoder = new TextDecoder();
                let fullChatResponse = '';
                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.text) fullChatResponse += data.text;
                                } catch {}
                            }
                        }
                    }
                }
                if (fullChatResponse) {
                    setChatMessages(prev => [
                        ...prev,
                        { sender: 'vera', text: `Analysis complete. VERA Score: ${score}/100. ${fullChatResponse}` }
                    ]);
                } else {
                    throw new Error('Empty response');
                }
            } else {
                throw new Error('Chat API failed');
            }
        } catch {
            // Fallback if chat API fails — still have real analysis
            const verdictMsg = score >= 90 ? 'strong buy — excellent equity position and low risk' :
                              score >= 70 ? 'solid deal — good equity with manageable risk' :
                              score >= 45 ? 'proceed with caution — check critical issues before committing' :
                              'high-risk — consider walking away';
            setChatMessages(prev => [
                ...prev,
                { sender: 'vera', text: `Analysis complete. VERA Score: ${score}/100. Verdict: ${result.verdict}. This is a ${verdictMsg}.` }
            ]);
        }
    } catch (err) {
        console.error('Analysis failed:', err);
        setChatMessages(prev => [
            ...prev,
            { sender: 'vera', text: '⚠️ Analysis engine encountered an error. Please check all fields and try again.' }
        ]);
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
      // Build messages in Gemini-compatible format that /api/chat expects
      const apiMessages = [
        ...chatMessages.map(m => ({
          role: m.sender === 'vera' ? 'model' as const : 'user' as const,
          parts: [{ text: m.text }]
        })),
        { role: 'user' as const, parts: [{ text: userMsg }] }
      ];

      const systemPrompt = `You are VERA, an AI vehicle analyst assistant. The user is evaluating a vehicle purchase. Current vehicle: ${form.year} ${form.make} ${form.model}, Price: $${form.price || '0'}, Mileage: ${form.mileage || '0'} mi. Analysis context: ${JSON.stringify(analysisResult?.fullAnalysis ? {
        verdict: analysisResult.verdict,
        score: analysisResult.verdictScore,
        equity: analysisResult.instantEquity,
        criticalIssues: analysisResult.criticalIssues?.map((i: any) => i.title)
      } : 'No analysis run')}. Be concise, helpful, and specific.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, systemPrompt }),
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

  const handleNegotiationScript = () => {
    const script = `NEGOTIATION SCRIPT — ${form.year} ${form.make} ${form.model}
============================================================

PRE-NEGOTIATION PREP
- Target Price: $${form.price || '___'}
- Market Range: Based on current comps
- Identified Issues: ${form.redFlags || 'None noted'}

OPENING
"Hi, I saw your listing for the ${form.year} ${form.make} ${form.model}. Is it still available?"

DISCOVERY QUESTIONS
1. How long have you owned the vehicle?
2. Any recent repairs or maintenance done?
3. Is there any wiggle room on the price?

LEVERAGE POINTS
${form.redFlags ? '- ' + form.redFlags : '- Research comparable listings for negotiation leverage'}
${form.sellerDescription ? '- Seller noted: ' + form.sellerDescription.slice(0, 100) : ''}

OFFER STRATEGY
- Opening Offer: 15-20% below asking price
- Target Settlement: 8-12% below asking
- Walk-Away Point: 90% of asking (if issues present)

CLOSING
"Based on the market research I've done, I can offer $___. I can close today if this works for you."

---
Generated by V.E.R.A. Vehicle Analyzer
`;

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `negotiation-script-${form.make}-${form.model}`.replace(/\s+/g, '-').toLowerCase() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFullIntelReport = () => {
    const analysis = analysisResult?.fullAnalysis || {};
    const mv = analysis.marketValues || {};
    const rideshare = analysis.rideshare || {};
    const ops = analysis.operationalCosts || {};
    const ins = analysis.insurance || {};
    const iss = analysis.criticalIssues || [];
    const eq = analysis.instantEquity ?? 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>VERA Intel Report — ${form.year} ${form.make} ${form.model}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0a0905;color:#d1d5db;line-height:1.6;padding:2rem}
  .wrapper{max-width:900px;margin:0 auto}
  h1{font-size:1.8rem;color:#fff;margin-bottom:.25rem}
  h2{font-size:1.15rem;color:#06b6d4;border-bottom:1px solid #262420;padding-bottom:.5rem;margin:2rem 0 1rem}
  h3{font-size:.95rem;color:#9ca3af;margin-bottom:.75rem}
  .meta{color:#6b7280;font-size:.85rem;margin-bottom:2rem}
  .badge{display:inline-block;padding:4px 14px;border-radius:6px;font-weight:700;font-size:.9rem}
  .badge-strong{background:#059669;color:#fff}.badge-good{background:#065f46;color:#6ee7b7}
  .badge-fair{background:#854d0e;color:#fde68a}.badge-avoid{background:#991b1b;color:#fca5a5}
  table{width:100%;border-collapse:collapse;margin:1rem 0}
  td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #1f1d1a}
  th{color:#6b7280;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}
  td{font-size:.9rem;color:#d1d5db}
  .val{color:#fff;font-weight:600}.pos{color:#34d399}.neg{color:#f87171}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
  .card{background:#131210;border:1px solid #262420;border-radius:10px;padding:1.25rem}
  .card h4{font-size:.8rem;color:#06b6d4;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem}
  .card .big{font-size:2rem;font-weight:800;color:#fff}
  .issue{padding:6px 10px;background:#1a1111;border-left:3px solid #ef4444;margin:4px 0;font-size:.85rem;border-radius:0 6px 6px 0}
  .chip{display:inline-block;padding:2px 10px;background:#1a1a1a;border:1px solid #333;border-radius:20px;font-size:.8rem;margin:2px 4px 2px 0}
  .desc{background:#0f0e0c;border:1px solid #262420;border-radius:8px;padding:1rem;font-size:.9rem;white-space:pre-wrap;color:#9ca3af}
  .footer{text-align:center;color:#4b5563;font-size:.75rem;margin-top:3rem;border-top:1px solid #1f1d1a;padding-top:1.5rem}
  @media print{body{background:#fff;color:#111}.card{background:#f8f8f8;border:1px solid #ddd}.val,.big,.badge-strong{color:#111}}
</style></head>
<body>
<div class="wrapper">
  <h1>${form.year} ${form.make} ${form.model}${form.trim ? ' ' + form.trim : ''}</h1>
  <div class="meta">Generated ${new Date().toLocaleString()} | Mode: ${activeMode === 'rideshare' ? 'Rideshare' : 'Personal Use'}</div>

  <!-- Vehicle Overview -->
  <div class="row">
    <div class="card">
      <h4>Vehicle Details</h4>
      <table>
        ${form.vin ? '<tr><th>VIN</th><td class="val">' + form.vin + '</td></tr>' : ''}
        ${form.price ? '<tr><th>Asking Price</th><td class="val">$' + Number(form.price).toLocaleString() + '</td></tr>' : ''}
        ${form.mileage ? '<tr><th>Mileage</th><td class="val">' + Number(form.mileage).toLocaleString() + ' mi</td></tr>' : ''}
        ${form.transmission ? '<tr><th>Transmission</th><td>' + form.transmission + '</td></tr>' : ''}
        ${form.fuelType ? '<tr><th>Fuel Type</th><td>' + form.fuelType + '</td></tr>' : ''}
        ${form.seats ? '<tr><th>Seats</th><td>' + form.seats + '</td></tr>' : ''}
        ${form.exteriorColor ? '<tr><th>Exterior</th><td>' + form.exteriorColor + '</td></tr>' : ''}
        ${form.interiorColor ? '<tr><th>Interior</th><td>' + form.interiorColor + '</td></tr>' : ''}
        ${form.titleStatus ? '<tr><th>Title Status</th><td>' + form.titleStatus + '</td></tr>' : ''}
        ${form.location ? '<tr><th>Location</th><td>' + form.location + '</td></tr>' : ''}
      </table>
    </div>
    <div class="card">
      <h4>Listing Info</h4>
      <table>
        ${form.platform ? '<tr><th>Platform</th><td>' + form.platform + '</td></tr>' : ''}
        ${form.postedDate ? '<tr><th>Posted</th><td>' + form.postedDate + '</td></tr>' : ''}
        ${form.listingUrl ? '<tr><th>URL</th><td style="word-break:break-all;max-width:300px">' + form.listingUrl + '</td></tr>' : ''}
      </table>
      ${form.exteriorCondition ? '<h4 style="margin-top:1rem">Exterior Condition</h4><p style="font-size:.85rem">' + form.exteriorCondition + '</p>' : ''}
      ${form.interiorCondition ? '<h4 style="margin-top:1rem">Interior Condition</h4><p style="font-size:.85rem">' + form.interiorCondition + '</p>' : ''}
    </div>
  </div>

  <!-- Seller Description -->
  ${form.sellerDescription ? '<h2>Seller Description</h2><div class="desc">' + form.sellerDescription + '</div>' : ''}

  ${analysisResult ? `
  <!-- VERA Score -->
  <h2>VERA Analysis</h2>
  <div class="row">
    <div class="card">
      <h4>VERA Score</h4>
      <div class="big">${analysisResult.verdictScore}/100</div>
      <span class="badge ${analysisResult.badgeClass?.includes('emerald') ? 'badge-strong' : analysisResult.badgeClass?.includes('yellow') ? 'badge-fair' : analysisResult.badgeClass?.includes('red') ? 'badge-avoid' : 'badge-good'}">${analysisResult.verdict}</span>
    </div>
    <div class="card">
      <h4>Instant Equity</h4>
      <div class="big ${eq >= 0 ? 'pos' : 'neg'}">${eq >= 0 ? '+' : ''}$${Math.abs(eq).toLocaleString()}</div>
      <p style="font-size:.8rem;color:#6b7280">${eq >= 0 ? 'Below market value — instant equity at purchase' : 'Above market value — negotiate down'}</p>
    </div>
  </div>

  <!-- Market Values -->
  ${mv.tradeIn ? '<div class="row" style="margin-top:1.5rem"><div class="card"><h4>Market Values</h4><table><tr><th>Trade-In</th><td class="val">$' + mv.tradeIn.toLocaleString() + '</td></tr><tr><th>Private Party</th><td class="val">$' + mv.privateParty.toLocaleString() + '</td></tr><tr><th>Dealer Retail</th><td class="val">$' + mv.dealerRetail.toLocaleString() + '</td></tr></table></div><div class="card"><h4>Financials</h4><table>' + (rideshare.weeklyGross ? '<tr><th>Weekly Gross</th><td class="val pos">$' + rideshare.weeklyGross.toLocaleString() + '</td></tr>' : '') + (ops.totalMonthly ? '<tr><th>Monthly OpEx</th><td class="val">$' + ops.totalMonthly.toFixed(0) + '</td></tr>' : '') + (ins.monthly ? '<tr><th>Insurance/mo</th><td class="val">$' + ins.monthly.toFixed(0) + '</td></tr>' : '') + (analysis.paybackWeeks ? '<tr><th>Payback</th><td class="val">' + analysis.paybackWeeks + ' weeks</td></tr>' : '') + '</table></div></div>' : ''}

  <!-- Critical Issues -->
  ${iss.length ? '<h2>Critical Issues</h2>' + iss.map((i: any) => '<div class="issue">' + (typeof i === 'string' ? i : (i.description || i.reason || JSON.stringify(i))) + '</div>').join('') : ''}
  ` : '<p style="color:#6b7280">No analysis data yet. Run AI Analysis first.</p>'}
  
  <div class="footer">Generated by V.E.R.A. Vehicle Analyzer &bull; veracar.co</div>
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vera-report-${form.make}-${form.model}`.replace(/\s+/g, '-').toLowerCase() + '.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleToggleChat = () => {
    setChatExpanded(v => !v);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0905] text-gray-200 overflow-hidden font-sans">
      <Sidebar history={history} />
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
        chatExpanded={chatExpanded}
        onNegotiationScript={handleNegotiationScript}
        onFullIntelReport={handleFullIntelReport}
        onToggleChat={handleToggleChat}
      />
    </div>
  );
};

export default App;
