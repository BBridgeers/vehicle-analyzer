"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Vehicle, AnalysisResult } from '@/lib/types';
import AnalysisInspector from '@/components/AnalysisInspector';
import FinalVerdictPanel from '@/components/FinalVerdictPanel';
import MarketChart from '@/components/MarketChart';
import IssueCard from '@/components/IssueCard';
import ScenarioAnalysisPanel from '@/components/ScenarioAnalysisPanel';
import BreakEvenPanel from '@/components/BreakEvenPanel';
import InsurancePanel from '@/components/InsurancePanel';
import OperationalCostsPanel from '@/components/OperationalCostsPanel';
import InitialInvestmentPanel from '@/components/InitialInvestmentPanel';
import PaybackPanel from '@/components/PaybackPanel';
import NegotiationPanel from '@/components/NegotiationPanel';
import ActionPlanPanel from '@/components/ActionPlanPanel';
import ConditionPanel from '@/components/ConditionPanel';
import SellerVerificationPanel from '@/components/SellerVerificationPanel';
import RidesharePanel from '@/components/RidesharePanel';

interface VehicleWithAnalysis {
  vehicle: Vehicle;
  result: AnalysisResult;
}

export default function EvaluationAnalysisPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<VehicleWithAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('verdict-final');

  useEffect(() => {
    const storageKey = `analysis_${params.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as VehicleWithAnalysis;
        setData(parsed);
      } catch (e) {
        setError('Failed to parse analysis data');
      }
    } else {
      setError('Analysis data not found');
    }
  }, [params.id]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0905] flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-xl font-bold mb-4">{error || 'Error Loading Analysis'}</div>
        <Link href="/" className="text-cyan-400 font-bold hover:text-cyan-300 underline mt-4">
          Return to Home
        </Link>
      </div>
    );
  }

  const { vehicle, result } = data;
  const { verdict, verdictScore, marketValues, instantEquity, criticalIssues } = result;
  
  const verdictLabel: Record<string, string> = {
    '🔥 STRONG BUY': '🔥 STRONG BUY',
    '✅ RECOMMENDED': '✅ RECOMMENDED',
    '⚠️ PROCEED WITH CAUTION': '⚠️ PROCEED WITH CAUTION',
    '🚫 AVOID': '🚫 AVOID',
  };
  const verdictClass = verdict.startsWith('🔥') ? 'emerald' : verdict.startsWith('✅') ? 'lime' : verdict.startsWith('⚠️') ? 'amber' : 'rose';
  const isPositiveEquity = instantEquity && instantEquity > 0;
  const equityColor = isPositiveEquity ? 'emerald' : 'rose';

  const downloadReport = () => {
    const report = [
      `════════════════════════════════════════════════`,
      `  VEHICLE ANALYSIS REPORT`,
      `  Generated: ${new Date().toLocaleDateString()}`,
      `════════════════════════════════════════════════`,
      ``,
      `─── VEHICLE ───`,
      `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`,
      `Price: $${vehicle.price.toLocaleString()}`,
      `Mileage: ${vehicle.mileage?.toLocaleString() || 'N/A'} mi`,
      `Location: ${vehicle.location || 'N/A'}`,
      `Title: ${vehicle.titleStatus || 'N/A'}`,
      ``,
      `─── VERDICT ───`,
      `${verdict} (Score: ${verdictScore}/100)`,
      `Instant Equity: ${isPositiveEquity ? '+' : ''}$${instantEquity?.toLocaleString() || 'N/A'}`,
      ``,
      `─── MARKET VALUE ───`,
      `Private Party Low: $${marketValues?.privatePartyLow?.toLocaleString() || 'N/A'}`,
      `Private Party Avg: $${marketValues?.privatePartyAvg?.toLocaleString() || 'N/A'}`,
      `Private Party High: $${marketValues?.privatePartyHigh?.toLocaleString() || 'N/A'}`,
      `Dealer Retail: $${marketValues?.dealerRetail?.toLocaleString() || 'N/A'}`,
      `Trade-In: $${marketValues?.tradeIn?.toLocaleString() || 'N/A'}`,
      ``,
      `─── ISSUES (${criticalIssues.length}) ───`,
      ...criticalIssues.map(i => `• ${i.title} (${i.severity}): ${i.concern}`),
      ``,
      `─── SCENARIOS ───`,
      ...(result.scenarios?.['Best Case'] ? [`Best Case: Repair $${result.scenarios['Best Case'].repairCost}, Total $${result.scenarios['Best Case'].totalCost}`] : []),
      ...(result.scenarios?.['Expected'] ? [`Expected: Repair $${result.scenarios['Expected'].repairCost}, Total $${result.scenarios['Expected'].totalCost}`] : []),
      ...(result.scenarios?.['Worst Case'] ? [`Worst Case: Repair $${result.scenarios['Worst Case'].repairCost}, Total $${result.scenarios['Worst Case'].totalCost}`] : []),
      ``,
      `─── INSURANCE ───`,
      ...Object.entries(result.insurance || {}).map(([tier, data]: any) => `${tier}: $${data.monthly}/mo`),
      ``,
      `─── OPERATIONAL COSTS ───`,
      ...Object.entries(result.operationalCosts || {}).map(([item, costs]: any) => `${item}: $${costs.monthly}/mo ($${costs.annual}/yr)`),
      ``,
      `─── NEGOTIATION ───`,
      `Opening: $${result.negotiation?.openingOffer || 'N/A'}`,
      `Target: $${result.negotiation?.targetPrice || 'N/A'}`,
      `Walk-Away: $${result.negotiation?.walkAwayPrice || 'N/A'}`,
      ``,
      `════════════════════════════════════════════════`,
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vehicle.year}_${vehicle.make}_${vehicle.model}_Analysis.txt`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0905] font-sans text-[#d1d5db] pb-20">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0905]/90 backdrop-blur border-b border-[#262420]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-black text-cyan-400 hover:text-cyan-300">VA</Link>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Analysis Report</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInspectorOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#141311] border border-[#262420] rounded-lg text-xs font-bold text-gray-300 hover:bg-[#1e1c19] transition-colors"
            >
              <span className="text-xs">Why?</span>
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-3 py-2 bg-[#141311] border border-[#262420] rounded-lg text-xs font-bold text-gray-300 hover:bg-[#1e1c19] transition-colors"
            >
              <span>Download Report</span>
            </button>
            <Link href="/fleet" className="px-4 py-2 bg-[#141311] border border-[#262420] rounded-lg text-xs font-bold text-gray-300 hover:text-cyan-400 transition-colors">
              Fleet Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Inspector Modal */}
      <AnalysisInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        analysis={result}
        vehicle={vehicle}
      />

      {/* Main Content */}
      <main className="pt-24 pb-20 max-w-5xl mx-auto px-4">
        {/* Verdict Banner */}
        <div className={`border-4 rounded-2xl p-8 mb-8 animate-pulse`} style={{ borderColor: verdictClass === 'emerald' ? 'var(--color-emerald)' : verdictClass === 'lime' ? 'var(--color-lime)' : verdictClass === 'amber' ? 'var(--color-amber)' : 'var(--color-rose)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">
                {verdictLabel[verdict] || verdict}
              </h1>
              <p className="text-lg text-gray-400">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ? `(${vehicle.trim})` : ''} • {vehicle.location || 'Unknown'} • ${Number(vehicle.price).toLocaleString()}
              </p>
            </div>
            <div className="text-center min-w-[200px]">
              <div className={`text-5xl font-black tracking-tighter mb-2 text-${verdictClass}-400`}>
                {verdictScore}/100
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                Score
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Asking Price</div>
            <div className="text-xl font-bold text-gray-100">${Number(vehicle.price).toLocaleString()}</div>
          </div>
          <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Market Value</div>
            <div className="text-xl font-bold text-gray-100">${(marketValues?.privatePartyAvg || 0).toLocaleString()}</div>
          </div>
          <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Instant Equity</div>
            <div className={`text-xl font-bold ${isPositiveEquity ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositiveEquity ? '+' : ''}${instantEquity?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Critical Issues</div>
            <div className="text-xl font-bold text-rose-400">{criticalIssues.length || 0}</div>
          </div>
        </div>

        {/* 1. Final Verdict */}
        <CollapsibleSection title="Final Verdict" icon={<span className="text-rose-500">⚖️</span>} expanded={expandedSection === 'verdict-final'} onToggle={() => toggleSection('verdict-final')}>
          <FinalVerdictPanel structuredVerdict={result.structuredVerdict} />
        </CollapsibleSection>

        {/* 2. Market Value Comparison */}
        <CollapsibleSection title="Market Value Comparison" icon={<span className="text-emerald-500">📊</span>} expanded={expandedSection === 'market'} onToggle={() => toggleSection('market')}>
          <MarketChart marketValues={result.marketValues} askingPrice={vehicle.price} />
        </CollapsibleSection>

        {/* 3. Critical Issues */}
        <CollapsibleSection title={`Critical Issues (${criticalIssues.length})`} icon={<span className="text-amber-500">⚠️</span>} expanded={expandedSection === 'issues'} onToggle={() => toggleSection('issues')}>
          <div className="space-y-3">
            {criticalIssues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} index={idx + 1} />
            ))}
          </div>
        </CollapsibleSection>

        {/* 3b. VIN History (if exists) */}
        {result.vinAnalysis && (
          <CollapsibleSection title={`Vehicle History & Records (${result.vinAnalysis.history.maintenance.length} Events)`} icon={<span className="text-blue-500">📋</span>} expanded={expandedSection === 'history'} onToggle={() => toggleSection('history')}>
            <div className="p-4 bg-blue-950/10 border border-blue-800/30 rounded-lg">
              <p className="text-sm text-blue-400 font-bold mb-3">No recalls or maintenance data available</p>
            </div>
          </CollapsibleSection>
        )}

        {/* 4. Scenario Analysis */}
        <CollapsibleSection title="Scenario-Based Financial Analysis" icon={<span className="text-amber-500">📈</span>} expanded={expandedSection === 'scenarios'} onToggle={() => toggleSection('scenarios')}>
          <ScenarioAnalysisPanel scenarios={result.scenarios} askingPrice={vehicle.price} />
        </CollapsibleSection>

        {/* 5. Break-Even */}
        <CollapsibleSection title="Break-Even Analysis" icon={<span className="text-emerald-500">📈</span>} expanded={expandedSection === 'breakeven'} onToggle={() => toggleSection('breakeven')}>
          <BreakEvenPanel breakEven={result.breakEven} />
        </CollapsibleSection>

        {/* 6. Insurance */}
        <CollapsibleSection title="Insurance Cost Estimates" icon={<span className="text-blue-500">🛡️</span>} expanded={expandedSection === 'insurance'} onToggle={() => toggleSection('insurance')}>
          <InsurancePanel insurance={result.insurance} />
        </CollapsibleSection>

        {/* 7. OpEx */}
        <CollapsibleSection title="Operational Cost Breakdown" icon={<span className="text-purple-500">💰</span>} expanded={expandedSection === 'opex'} onToggle={() => toggleSection('opex')}>
          <OperationalCostsPanel costs={result.operationalCosts} />
        </CollapsibleSection>

        {/* 8. Initial Investment (Rideshare only) */}
        {result.initialInvestment && (
          <CollapsibleSection title="Initial Investment Required" icon={<span className="text-cyan-500">🏦</span>} expanded={expandedSection === 'investment'} onToggle={() => toggleSection('investment')}>
            <InitialInvestmentPanel investment={result.initialInvestment} />
          </CollapsibleSection>
        )}

        {/* 9. ROI & Payback (Rideshare only) */}
        {result.paybackWeeks && (
          <CollapsibleSection title="ROI & Payback Timeline" icon={<span className="text-lime-500">⏱️</span>} expanded={expandedSection === 'payback'} onToggle={() => toggleSection('payback')}>
            <PaybackPanel
              paybackWeeks={result.paybackWeeks}
              vehiclePrice={vehicle.price}
              weeklyEarnings={{
                conservative: result.rideshare.earnings.conservative.weeklyNet,
                baseline: result.rideshare.earnings.baseline.weeklyNet,
                optimistic: result.rideshare.earnings.optimistic.weeklyNet,
              }}
            />
          </CollapsibleSection>
        )}

        {/* 10. Rideshare (Rideshare only) */}
        {result.rideshare && (
          <CollapsibleSection title="Rideshare Eligibility & Earnings" icon={<span className="text-cyan-500">🚗</span>} expanded={expandedSection === 'rideshare'} onToggle={() => toggleSection('rideshare')}>
            <RidesharePanel
              eligibility={result.rideshare.eligibility}
              earnings={result.rideshare.earnings}
              vehiclePrice={vehicle.price}
            />
          </CollapsibleSection>
        )}

        {/* 11. Negotiation */}
        <CollapsibleSection title="Negotiation Strategy" icon={<span className="text-emerald-500">🤝</span>} expanded={expandedSection === 'negotiation'} onToggle={() => toggleSection('negotiation')}>
          <NegotiationPanel negotiation={result.negotiation} askingPrice={vehicle.price} />
        </CollapsibleSection>

        {/* 12. Action Plan */}
        <CollapsibleSection title="Pre-Purchase Action Plan" icon={<span className="text-cyan-500">✅</span>} expanded={expandedSection === 'actionplan'} onToggle={() => toggleSection('actionplan')}>
          <ActionPlanPanel actionPlan={result.actionPlan} />
        </CollapsibleSection>

        {/* 13. Condition */}
        <CollapsibleSection title="Condition Assessment" icon={<span className="text-gray-400">🔍</span>} expanded={expandedSection === 'condition'} onToggle={() => toggleSection('condition')}>
          <ConditionPanel condition={result.conditionAssessment} />
        </CollapsibleSection>

        {/* 14. Seller Verification */}
        <CollapsibleSection title="Seller Verification" icon={<span className="text-yellow-500">👤</span>} expanded={expandedSection === 'seller'} onToggle={() => toggleSection('seller')}>
          <SellerVerificationPanel seller={result.sellerVerification} />
        </CollapsibleSection>

        {/* Bottom Action Bar */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => {
              // Add to fleet logic - save to localStorage and navigate
              localStorage.setItem('vera_fleet', JSON.stringify({ type: 'add', vehicle, result }));
              router.push('/fleet');
            }}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-500 transition-colors text-lg"
          >
            ✅ Add to Fleet
          </button>
          <button
            onClick={() => {
              // Pass logic - save and navigate
              localStorage.setItem('vera_fleet', JSON.stringify({ type: 'pass', vehicle, result }));
              router.push('/fleet');
            }}
            className="flex items-center justify-center gap-2 bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-500 transition-colors text-lg"
          >
            🚫 Pass
          </button>
        </div>
      </main>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, icon, expanded, onToggle, children }: { title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#262420] last:border-0">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-[#1a1816] transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-[var(--color-accent-red)] drop-shadow-[0_0_6px_rgba(217,74,42,0.35)]">{icon}</div>
          <h3 className="text-sm font-mono tracking-widest uppercase font-bold text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
        {expanded ? (
          <span className="text-gray-500">▲</span>
        ) : (
          <span className="text-gray-500">▼</span>
        )}
      </button>
      {expanded && <div className="px-6 py-4">{children}</div>}
    </div>
  );
}
