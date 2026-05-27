"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface AnalysisData {
  vehicle: Vehicle;
  result: AnalysisResult;
  timestamp: string;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('verdict-final');
  const [addingToFleet, setAddingToFleet] = useState(false);

  const fetchAnalysis = () => {
    setLoading(true);
    fetch('/api/analysis')
      .then(res => {
        if (!res.ok) throw new Error('No analysis found');
        return res.json();
      })
      .then(json => {
        if (json.success) {
          setData({ vehicle: json.vehicle, result: json.result, timestamp: json.timestamp });
          setError(null);
        } else {
          setError(json.error || 'No analysis found');
          setData(null);
        }
      })
      .catch(e => {
        setError(e.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalysis(); }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const downloadReport = () => {
    if (!data) return;
    const { vehicle, result } = data;
    const { verdict, verdictScore, marketValues, instantEquity, criticalIssues } = result;
    const isPositiveEquity = instantEquity && instantEquity > 0;

    const report = [
      `════════════════════════════════════════════════`,
      `  V.E.R.A. VEHICLE ANALYSIS REPORT`,
      `  Generated: ${new Date().toLocaleDateString()}  •  ${new Date().toLocaleTimeString()}`,
      `════════════════════════════════════════════════`,
      ``,
      `─── VEHICLE ───`,
      `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`,
      `Price: $${vehicle.price.toLocaleString()}`,
      `Mileage: ${vehicle.mileage?.toLocaleString() || 'N/A'} mi`,
      `Location: ${vehicle.location || 'N/A'}`,
      `VIN: ${vehicle.vin || 'N/A'}`,
      `Title Status: ${vehicle.titleStatus || 'N/A'}`,
      `Transmission: ${vehicle.transmission || 'N/A'}  •  Fuel: ${vehicle.fuelType || 'N/A'}`,
      ``,
      `─── VERDICT ───`,
      `${verdict} (Score: ${verdictScore}/100)`,
      `Instant Equity: ${isPositiveEquity ? '+' : ''}$${instantEquity?.toLocaleString() || 'N/A'}`,
      `Confidence: ${result.structuredVerdict?.confidence || 'N/A'}%`,
      ``,
      `─── BUY IF ───`,
      ...(result.structuredVerdict?.buyIf || []).map(c => `✅ ${c}`),
      ``,
      `─── WALK AWAY IF ───`,
      ...(result.structuredVerdict?.walkAwayIf || []).map(c => `🚫 ${c}`),
      ``,
      `─── RED FLAGS ───`,
      ...(result.structuredVerdict?.redFlags || []).map(f => `⚠️ ${f}`),
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
      ...(result.scenarios?.['Best Case'] ? [`Best Case: Repair $${result.scenarios['Best Case'].repairCost?.toLocaleString()}, Total $${result.scenarios['Best Case'].totalCost?.toLocaleString()}`] : []),
      ...(result.scenarios?.['Expected'] ? [`Expected: Repair $${result.scenarios['Expected'].repairCost?.toLocaleString()}, Total $${result.scenarios['Expected'].totalCost?.toLocaleString()}`] : []),
      ...(result.scenarios?.['Worst Case'] ? [`Worst Case: Repair $${result.scenarios['Worst Case'].repairCost?.toLocaleString()}, Total $${result.scenarios['Worst Case'].totalCost?.toLocaleString()}`] : []),
      ``,
      `─── BREAK-EVEN ───`,
      `Repair Cushion: $${result.breakEven?.repairCushion?.toLocaleString() || 'N/A'}`,
      `Max Repair Budget: $${result.breakEven?.maxRepairBudget?.toLocaleString() || 'N/A'}`,
      ``,
      `─── INSURANCE ───`,
      ...Object.entries(result.insurance || {}).map(([tier, ins]: any) => `  ${tier}: $${ins.monthly}/mo ($${ins.annual}/yr)`),
      ``,
      `─── OPERATIONAL COSTS ───`,
      ...Object.entries(result.operationalCosts || {}).filter(([k]) => k !== 'totalMonthly' && k !== 'totalAnnual' && k !== 'costPerMile').map(([item, costs]: any) => `  ${item}: $${costs.monthly}/mo ($${costs.annual}/yr)`),
      `  TOTAL: $${result.operationalCosts?.totalMonthly?.toLocaleString() || 'N/A'}/mo ($${result.operationalCosts?.totalAnnual?.toLocaleString() || 'N/A'}/yr)`,
      `  Cost Per Mile: $${result.operationalCosts?.costPerMile || 'N/A'}`,
      ``,
      `─── NEGOTIATION ───`,
      `Opening Offer: $${result.negotiation?.openingOffer?.toLocaleString() || 'N/A'}`,
      `Target Price: $${result.negotiation?.targetPrice?.toLocaleString() || 'N/A'}`,
      `Walk-Away: $${result.negotiation?.walkAwayPrice?.toLocaleString() || 'N/A'}`,
      `Potential Savings: $${result.negotiation?.savingsIfSuccessful?.toLocaleString() || 'N/A'}`,
      ...(result.negotiation?.leveragePoints || []).map((lp: string) => `  • ${lp}`),
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

  const addToFleet = async () => {
    if (!data) return;
    setAddingToFleet(true);
    try {
      const fleetRes = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data.vehicle, analysis: data.result }),
      });
      if (fleetRes.ok) router.push('/fleet');
    } catch (e) {
      console.error('Failed to add to fleet:', e);
    } finally {
      setAddingToFleet(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0905] flex items-center justify-center">
        <div className="text-cyan-400 text-lg font-bold animate-pulse">Loading Analysis...</div>
      </div>
    );
  }

  // ── Empty State ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0905] flex">
        <Sidebar current="analysis" />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-6xl mb-6">📋</div>
          <div className="text-gray-400 text-xl font-bold mb-2">No Analysis Yet</div>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Run a vehicle evaluation from the New Evaluation page to generate your first VERA Intelligence Report.
          </p>
          <Link href="/" className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-500 transition-colors">
            Go to New Evaluation
          </Link>
        </div>
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
  const verdictColorName = verdict.startsWith('🔥') ? 'emerald' : verdict.startsWith('✅') ? 'lime' : verdict.startsWith('⚠️') ? 'amber' : 'rose';
  const verdictHex = { emerald: '#10b981', lime: '#84cc16', amber: '#f59e0b', rose: '#f43f5e' }[verdictColorName];
  const isPositiveEquity = instantEquity && instantEquity > 0;

  return (
    <div className="min-h-screen bg-[#0a0905] font-sans text-[#d1d5db] flex">
      <Sidebar current="analysis" />

      <main className="flex-1 pb-20">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#262420] bg-[#0a0905]/90 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Analysis Report</span>
            <span className="text-[10px] text-gray-600">{new Date(data.timestamp).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsInspectorOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-[#141311] border border-[#262420] rounded-lg text-xs font-bold text-gray-300 hover:bg-[#1e1c19] transition-colors">
              Why?
            </button>
            <button onClick={downloadReport} className="flex items-center gap-2 px-3 py-2 bg-[#141311] border border-[#262420] rounded-lg text-xs font-bold text-gray-300 hover:bg-[#1e1c19] transition-colors">
              Download Report
            </button>
          </div>
        </div>

        <AnalysisInspector isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} analysis={result} vehicle={vehicle} />

        <div className="max-w-5xl mx-auto px-4 pt-6">
          {/* ── VERDICT BANNER with Decision Buttons ── */}
          <div className="border-4 rounded-2xl p-8 mb-8" style={{ borderColor: verdictHex, animation: 'verdictPulse 2s ease-in-out infinite' }}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">
                  {verdictLabel[verdict] || verdict}
                </h1>
                <p className="text-lg text-gray-400">
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ? `(${vehicle.trim})` : ''} • {vehicle.location || 'Unknown'} • ${Number(vehicle.price).toLocaleString()}
                </p>
              </div>
              <div className="text-center min-w-[200px]">
                <div className="text-5xl font-black tracking-tighter mb-2" style={{ color: verdictHex }}>
                  {verdictScore}/100
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Score</div>
              </div>
            </div>

            {/* Decision Buttons — IN the banner per design spec */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={addToFleet}
                disabled={addingToFleet}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-500 transition-colors text-lg disabled:opacity-50"
              >
                {addingToFleet ? 'Adding...' : '✅ Add to Fleet'}
              </button>
              <Link
                href="/fleet"
                className="flex items-center justify-center gap-2 bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-500 transition-colors text-lg"
              >
                🚫 Pass
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Asking Price" value={`$${Number(vehicle.price).toLocaleString()}`} />
            <MetricCard label="Market Value" value={`$${(marketValues?.privatePartyAvg || 0).toLocaleString()}`} />
            <MetricCard
              label="Instant Equity"
              value={`${isPositiveEquity ? '+' : ''}$${instantEquity?.toLocaleString() || 'N/A'}`}
              color={isPositiveEquity ? 'emerald' : 'rose'}
            />
            <MetricCard label="Critical Issues" value={`${criticalIssues.length || 0}`} color="rose" />
          </div>

          {/* 14 Collapsible Sections */}
          <CollapsibleSection title="Final Verdict" icon="⚖️" expanded={expandedSection === 'verdict-final'} onToggle={() => toggleSection('verdict-final')}>
            <FinalVerdictPanel structuredVerdict={result.structuredVerdict} />
          </CollapsibleSection>

          <CollapsibleSection title="Market Value Comparison" icon="📊" expanded={expandedSection === 'market'} onToggle={() => toggleSection('market')}>
            <MarketChart marketValues={result.marketValues} askingPrice={vehicle.price} />
          </CollapsibleSection>

          <CollapsibleSection title={`Critical Issues (${criticalIssues.length})`} icon="⚠️" expanded={expandedSection === 'issues'} onToggle={() => toggleSection('issues')}>
            <div className="space-y-3">
              {criticalIssues.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} index={idx + 1} />
              ))}
            </div>
          </CollapsibleSection>

          {result.vinAnalysis && (
            <CollapsibleSection title="Vehicle History & Records" icon="📋" expanded={expandedSection === 'history'} onToggle={() => toggleSection('history')}>
              <VinHistoryPanel vinAnalysis={result.vinAnalysis} />
            </CollapsibleSection>
          )}

          <CollapsibleSection title="Scenario-Based Financial Analysis" icon="📈" expanded={expandedSection === 'scenarios'} onToggle={() => toggleSection('scenarios')}>
            <ScenarioAnalysisPanel scenarios={result.scenarios} askingPrice={vehicle.price} />
          </CollapsibleSection>

          <CollapsibleSection title="Break-Even Analysis" icon="📉" expanded={expandedSection === 'breakeven'} onToggle={() => toggleSection('breakeven')}>
            <BreakEvenPanel breakEven={result.breakEven} />
          </CollapsibleSection>

          <CollapsibleSection title="Insurance Cost Estimates" icon="🛡️" expanded={expandedSection === 'insurance'} onToggle={() => toggleSection('insurance')}>
            <InsurancePanel insurance={result.insurance} />
          </CollapsibleSection>

          <CollapsibleSection title="Operational Cost Breakdown" icon="💰" expanded={expandedSection === 'opex'} onToggle={() => toggleSection('opex')}>
            <OperationalCostsPanel costs={result.operationalCosts} />
          </CollapsibleSection>

          {result.initialInvestment && (
            <CollapsibleSection title="Initial Investment Required" icon="🏦" expanded={expandedSection === 'investment'} onToggle={() => toggleSection('investment')}>
              <InitialInvestmentPanel investment={result.initialInvestment} />
            </CollapsibleSection>
          )}

          {result.paybackWeeks && (
            <CollapsibleSection title="ROI & Payback Timeline" icon="⏱️" expanded={expandedSection === 'payback'} onToggle={() => toggleSection('payback')}>
              <PaybackPanel
                paybackWeeks={result.paybackWeeks}
                vehiclePrice={vehicle.price}
                weeklyEarnings={{
                  conservative: result.rideshare?.earnings?.conservative?.weeklyNet || 0,
                  baseline: result.rideshare?.earnings?.baseline?.weeklyNet || 0,
                  optimistic: result.rideshare?.earnings?.optimistic?.weeklyNet || 0,
                }}
              />
            </CollapsibleSection>
          )}

          {result.rideshare && (
            <CollapsibleSection title="Rideshare Eligibility & Earnings" icon="🚗" expanded={expandedSection === 'rideshare'} onToggle={() => toggleSection('rideshare')}>
              <RidesharePanel eligibility={result.rideshare.eligibility} earnings={result.rideshare.earnings} vehiclePrice={vehicle.price} />
            </CollapsibleSection>
          )}

          <CollapsibleSection title="Negotiation Strategy" icon="🤝" expanded={expandedSection === 'negotiation'} onToggle={() => toggleSection('negotiation')}>
            <NegotiationPanel negotiation={result.negotiation} askingPrice={vehicle.price} />
          </CollapsibleSection>

          <CollapsibleSection title="Pre-Purchase Action Plan" icon="✅" expanded={expandedSection === 'actionplan'} onToggle={() => toggleSection('actionplan')}>
            <ActionPlanPanel actionPlan={result.actionPlan} />
          </CollapsibleSection>

          <CollapsibleSection title="Condition Assessment" icon="🔍" expanded={expandedSection === 'condition'} onToggle={() => toggleSection('condition')}>
            <ConditionPanel condition={result.conditionAssessment} />
          </CollapsibleSection>

          <CollapsibleSection title="Seller Verification" icon="👤" expanded={expandedSection === 'seller'} onToggle={() => toggleSection('seller')}>
            <SellerVerificationPanel seller={result.sellerVerification} />
          </CollapsibleSection>

          <div className="h-12" />
        </div>
      </main>

      <style jsx>{`
        @keyframes verdictPulse {
          0%, 100% { box-shadow: 0 0 20px ${verdictHex}33; }
          50% { box-shadow: 0 0 40px ${verdictHex}66; }
        }
      `}</style>
    </div>
  );
}

// ── Sidebar ──
function Sidebar({ current }: { current: string }) {
  return (
    <aside className="w-64 bg-[#11100e] border-r border-[#262420] flex flex-col h-screen flex-shrink-0 sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-[#262420]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white tracking-widest text-sm">VA</div>
          <span className="font-bold text-lg tracking-wider text-gray-100">V.E.R.A.</span>
        </Link>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        <NavLink href="/" current={current} id="new">New Evaluation</NavLink>
        <NavLink href="/analysis" current={current} id="analysis">Analysis Report</NavLink>
        <NavLink href="/fleet" current={current} id="fleet">Fleet Dashboard</NavLink>
        <NavLink href="/comparison" current={current} id="comparison">Comparison Matrix</NavLink>
        <NavLink href="/analytics" current={current} id="analytics">Market Analytics</NavLink>
      </nav>
    </aside>
  );
}

function NavLink({ href, current, id, children }: { href: string; current: string; id: string; children: React.ReactNode }) {
  const isActive = current === id;
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#1e1c19] text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1816]'}`}>
      {children}
    </Link>
  );
}

// ── Metric Card ──
function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'rose' ? 'text-rose-400' : 'text-gray-100';
  return (
    <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
      <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

// ── Collapsible Section ──
function CollapsibleSection({ title, icon, expanded, onToggle, children }: { title: string; icon: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#262420] last:border-0">
      <button onClick={onToggle} className="w-full px-6 py-4 text-left hover:bg-[#1a1816] transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-mono tracking-widest uppercase font-bold text-[#d1d5db]">{title}</h3>
        </div>
        <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <div className="px-6 py-4">{children}</div>}
    </div>
  );
}

// ── VIN History Panel ──
function VinHistoryPanel({ vinAnalysis }: { vinAnalysis: any }) {
  const hasRecalls = vinAnalysis?.recalls?.length > 0;
  const hasHistory = vinAnalysis?.history?.maintenance?.length > 0;

  return (
    <div className="space-y-4">
      {hasRecalls ? (
        <div className="p-4 bg-rose-950/20 border border-rose-800/30 rounded-lg">
          <p className="text-sm font-bold text-rose-400 mb-2">⚠️ Open Recalls ({vinAnalysis.recalls.length})</p>
          {vinAnalysis.recalls.map((recall: any, i: number) => (
            <div key={i} className="text-sm text-gray-300 mb-2 ml-2 border-l-2 border-rose-800 pl-3">
              <p className="font-medium">{recall.component}</p>
              <p className="text-xs text-gray-500">{recall.description}</p>
              <p className="text-xs text-emerald-400 mt-1">Remedy: {recall.remedy}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-lg">
          <p className="text-sm font-bold text-emerald-400">✅ No open recalls detected</p>
        </div>
      )}

      {hasHistory ? (
        <div className="p-4 bg-[#141311] border border-[#262420] rounded-lg">
          <p className="text-sm font-bold text-gray-300 mb-3">Service History ({vinAnalysis.history.maintenance.length} records)</p>
          <div className="space-y-2">
            {vinAnalysis.history.maintenance.map((event: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-cyan-800 pl-3 ml-1">
                <div className="text-xs text-gray-500 font-mono w-20 shrink-0">{event.date || 'N/A'}</div>
                <div>
                  <p className="text-gray-300">{event.description}</p>
                  {event.mileage && <p className="text-xs text-gray-500">{event.mileage.toLocaleString()} miles</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#141311] border border-[#262420] rounded-lg">
          <p className="text-sm text-gray-500">No service history records found for this VIN.</p>
        </div>
      )}
    </div>
  );
}
