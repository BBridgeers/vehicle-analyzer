"use client";

import React, { useRef, useState } from 'react';

export default function AgentForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [output, setOutput] = useState("");

    const generateFormat = (format: 'json' | 'csv' | 'md') => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const vehicle: Record<string, any> = Object.fromEntries(formData.entries());

        // Convert numbers
        if (vehicle.year) vehicle.year = parseInt(vehicle.year);
        if (vehicle.price) vehicle.price = parseFloat(vehicle.price);
        if (vehicle.mileage) vehicle.mileage = parseInt(vehicle.mileage);

        let result = '';

        if (format === 'json') {
            result = JSON.stringify([vehicle], null, 2);
        } else if (format === 'csv') {
            const headers = Object.keys(vehicle).join(',');
            const values = Object.values(vehicle).map(v =>
                typeof v === 'string' && (v.includes(',') || v.includes('\n')) ? `"${v}"` : v
            ).join(',');
            result = headers + '\n' + values;
        } else if (format === 'md') {
            result = `# Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}\n\n`;
            for (const [key, value] of Object.entries(vehicle)) {
                if (value) result += `- ${key}: ${value}\n`;
            }
        }

        setOutput(result);
        navigator.clipboard.writeText(result).then(() => {
            alert(format.toUpperCase() + ' generated! (Copied to clipboard)');
        });
    };

    return (
        <div className="font-mono max-w-4xl mx-auto my-8 p-4 bg-zinc-100 text-zinc-900 min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold mb-8 border-b border-zinc-200 pb-4">Agent Data Entry Portal</h1>
                <p className="mb-6">Use this form to aggregate vehicle data found on marketplaces. Click "Generate Output" to get JSON/CSV ready for the Vehicle Analyzer.</p>

                <form ref={formRef} id="vehicleForm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Core Required Fields */}
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="year">Year *</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="number" id="year" name="year" required placeholder="e.g. 2018" />
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="make">Make *</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="text" id="make" name="make" required placeholder="e.g. Toyota" />
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="model">Model *</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="text" id="model" name="model" required placeholder="e.g. Camry" />
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="price">Price ($) *</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="number" id="price" name="price" required placeholder="15000" />
                        </div>

                        {/* Secondary Fields */}
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="mileage">Mileage</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="number" id="mileage" name="mileage" placeholder="0" />
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="trim">Trim</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="text" id="trim" name="trim" placeholder="e.g. SE" />
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="vin">VIN</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="text" id="vin" name="vin" maxLength={17} />
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="location">Location</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="text" id="location" name="location" placeholder="City, State" />
                        </div>

                        {/* Details */}
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="titleStatus">Title Status</label>
                            <select className="w-full p-2 border border-zinc-300 rounded font-inherit" id="titleStatus" name="titleStatus">
                                <option value="Clean">Clean</option>
                                <option value="Salvage">Salvage</option>
                                <option value="Rebuilt">Rebuilt</option>
                                <option value="Lien">Lien</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2" htmlFor="transmission">Transmission</label>
                            <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="text" id="transmission" name="transmission" defaultValue="Automatic" />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block font-bold mb-2" htmlFor="listingUrl">Listing URL</label>
                        <input className="w-full p-2 border border-zinc-300 rounded font-inherit" type="url" id="listingUrl" name="listingUrl" placeholder="https://..." />
                    </div>

                    <div className="mb-4">
                        <label className="block font-bold mb-2" htmlFor="description">Description / Notes</label>
                        <textarea className="w-full p-2 border border-zinc-300 rounded font-inherit" id="description" name="description" rows={4}></textarea>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => generateFormat('json')} className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">Generate JSON</button>
                        <button type="button" onClick={() => generateFormat('csv')} className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">Generate CSV</button>
                        <button type="button" onClick={() => generateFormat('md')} className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">Generate Markdown</button>
                        <button type="reset" onClick={() => setOutput("")} className="px-6 py-3 bg-zinc-500 text-white rounded font-bold hover:bg-zinc-600 transition-colors">Clear</button>
                    </div>
                </form>

                {output && (
                    <div className="mt-8 p-4 bg-zinc-800 text-green-400 rounded whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                        {output}
                    </div>
                )}
            </div>
        </div>
    );
}
