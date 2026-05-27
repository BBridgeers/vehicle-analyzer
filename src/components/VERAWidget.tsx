"use client";

import React, { useState } from 'react';

interface VERAWidgetProps {
  analysisResult?: any;
  vehicle?: any;
  onSaveToFleet?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

export default function VERAWidget({ analysisResult, vehicle, onSaveToFleet, isSaved, compact }: VERAWidgetProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'vera', text: '👋 I\'m VERA — your vehicle analysis co-pilot. Ask me anything about this vehicle, negotiation strategy, or how to interpret these results.' }
  ]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', parts: [{ text: `You are VERA, a vehicle analysis AI. Context: ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} — $${vehicle.price} — ${vehicle.mileage}mi` : 'No vehicle loaded'}. Be concise and helpful.` }] },
            { role: 'user', parts: [{ text: userMsg }] }
          ],
          systemPrompt: 'You are VERA, an expert vehicle analyst. Answer concisely and directly.'
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'vera', text: data.reply || data.text || 'Analysis complete.' }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'vera', text: 'I\'m having trouble connecting. Try again in a moment.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { sender: 'vera', text: 'Connection error. Please try again.' }]);
    }
  };

  return (
    <aside className={`${compact ? 'w-80' : 'w-[380px]'} bg-[#141311] border-l border-[#262420] flex flex-col h-full flex-shrink-0`}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#262420] bg-[#1a1816]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </div>
          <span className="font-bold text-xs text-cyan-400 uppercase tracking-widest">VERA AI Active</span>
        </div>
        {onSaveToFleet && (
          <button onClick={onSaveToFleet} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-cyan-600/10 text-cyan-400 border border-cyan-600/30 hover:bg-cyan-600/20'}`}>
            {isSaved ? '✓ In Fleet' : '+ Fleet'}
          </button>
        )}
      </div>

      {/* Score summary if available */}
      {analysisResult && (
        <div className="px-4 py-3 border-b border-[#262420] bg-[#11100e]">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black" style={{ color: analysisResult.scoreColor || '#06b6d4' }}>
              {analysisResult.score || '—'}/100
            </div>
            <div>
              <div className="text-xs font-bold text-gray-300">{analysisResult.badge || 'Analyzed'}</div>
              <div className="text-[10px] text-gray-500">{analysisResult.equity || ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${
              msg.sender === 'user'
                ? 'bg-cyan-600 text-white rounded-br-sm'
                : 'bg-[#1e1c19] text-gray-300 rounded-bl-sm border border-[#2a2825]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#262420]">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            placeholder="Ask VERA..."
            className="flex-1 bg-[#0f0e0c] border border-[#262420] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-600/50"
          />
          <button onClick={handleSendChat} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors">
            →
          </button>
        </div>
      </div>
    </aside>
  );
}
