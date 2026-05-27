"use client";

import { analyzeVehicle } from "@/lib/analyze";
import { kvGet } from "@/lib/kv-client";
import type { Vehicle } from "@/lib/types";
export default async function EvaluationAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  let vehicle: Vehicle | null = null;
  let result: AnalysisResult | null = null;

  try {
    const { id } = await params;
    const fleet = await kvGet<Vehicle[]>('fleet') || [];
    const v = fleet.find((v: Vehicle) => v.id === id || v.name?.includes(id));
    
    if (v) {
      vehicle = v;
      result = await analyzeVehicle(v);
    }
  } catch (e) {
    console.error('Failed to load analysis:', e);
  }

  return (
    <div className="min-h-screen bg-[#0a0905] text-[#d1d5db] font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0905]/90 backdrop-blur border-b border-[#262420]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-xl font-black text-cyan-400">VA</a>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Evaluation Analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/fleet" className="px-4 py-2 bg-[#141311] border border-[#262420] rounded-lg text-xs font-bold text-gray-300 hover:text-cyan-400 transition-colors">
              Fleet Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-20 max-w-5xl mx-auto px-4">
        {!vehicle || !result ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-black text-white mb-4">Vehicle Not Found</h2>
            <p className="text-gray-500">The requested vehicle analysis could not be retrieved.</p>
            <a href="/" className="mt-6 px-6 py-3 bg-cyan-600 text-white rounded-lg font-bold">
              Back to Home
            </a>
          </div>
        ) : (
          <div>
            {/* Verdict Header */}
            <div className={`border-4 rounded-2xl p-8 mb-8 ${
              result.verdict.includes('STRONG BUY') ? 'border-emerald-500 bg-emerald-950/10' :
              result.verdict.includes('RECOMMENDED') ? 'border-lime-500 bg-lime-950/10' :
              result.verdict.includes('CAUTION') ? 'border-amber-500 bg-amber-950/10' :
              'border-rose-500 bg-rose-950/10'
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">{vehicle.name || vehicle.make + ' ' + vehicle.model}</h1>
                  <p className="text-lg text-gray-400">
                    {vehicle.location || 'Unknown Location'} • {vehicle.year || ''} {vehicle.make || ''} {vehicle.model || ''}
                  </p>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className={`text-5xl font-black tracking-tighter mb-2 ${
                    result.verdict.includes('STRONG BUY') ? 'text-emerald-400' :
                    result.verdict.includes('RECOMMENDED') ? 'text-lime-400' :
                    result.verdict.includes('CAUTION') ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    {result.verdict.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                    Score: {result.verdictScore || 0}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Asking Price</div>
                <div className="text-xl font-bold text-gray-100">${Number(vehicle.price).toLocaleString()}</div>
              </div>
              <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Market Value</div>
                <div className="text-xl font-bold text-gray-100">${(result.marketValues?.privatePartyAvg || 0).toLocaleString()}</div>
              </div>
              <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Instant Equity</div>
                <div className={`text-xl font-bold ${result.instantEquity && result.instantEquity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.instantEquity ? (result.instantEquity > 0 ? '+' : '') + result.instantEquity.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="bg-[#141311] border border-[#262420] rounded-xl p-4">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Critical Issues</div>
                <div className="text-xl font-bold text-rose-400">{result.criticalIssues.length || 0}</div>
              </div>
            </div>

            {/* Full Analysis Sections */}
            <div className="bg-[#141311] border border-[#262420] rounded-xl overflow-hidden">
              <DetailsSection title="Final Verdict" defaultOpen>
                <div dangerouslySetInnerHTML={{ __html: result.structuredVerdict?.buyIf?.join('<br>') || '' }} />
              </DetailsSection>
              <DetailsSection title="Market Value Comparison" defaultOpen>
                <MarketChart analysis={result} />
              </DetailsSection>
              <DetailsSection title="Critical Issues" defaultOpen>
                {result.criticalIssues.map((issue, idx) => (
                  <div key={idx} className="border-b border-[#262420] last:border-0 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                        issue.severity === 'critical' ? 'bg-rose-900/30 text-rose-400' :
                        issue.severity === 'high' ? 'bg-amber-900/30 text-amber-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {issue.severity}
                      </span>
                      <h3 className="font-bold text-white">{issue.title}</h3>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p><strong>Concern:</strong> {issue.concern}</p>
                      <p><strong>Benign:</strong> {issue.benign}</p>
                      <p><strong>Risk:</strong> {issue.worstCase}</p>
                      <p><strong>Action:</strong> {issue.recommendedAction}</p>
                    </div>
                  </div>
                ))}
              </DetailsSection>
              <DetailsSection title="Scenario-Based Financial Analysis">
                <ScenarioAnalysis analysis={result} />
              </DetailsSection>
              <DetailsSection title="Break-Even Analysis">
                <BreakEvenPanel analysis={result} />
              </DetailsSection>
              <DetailsSection title="Insurance Cost Estimates">
                <InsurancePanel analysis={result} />
              </DetailsSection>
              <DetailsSection title="Operational Cost Breakdown">
                <OperationalCostsPanel analysis={result} />
              </DetailsSection>
              {result.scenarios && (
                <DetailsSection title="Initial Investment Required">
                  <InitialInvestmentPanel analysis={result} />
                </DetailsSection>
              )}
              {result.paybackWeeks && (
                <DetailsSection title="ROI & Payback Timeline">
                  <PaybackPanel analysis={result} />
                </DetailsSection>
              )}
              <DetailsSection title="Negotiation Strategy">
                <NegotiationPanel analysis={result} />
              </DetailsSection>
              <DetailsSection title="Pre-Purchase Action Plan">
                <ActionPlanPanel analysis={result} />
              </DetailsSection>
              <DetailsSection title="Condition Assessment">
                <ConditionPanel analysis={result} />
              </DetailsSection>
              <DetailsSection title="Seller Verification">
                <SellerVerificationPanel analysis={result} />
              </DetailsSection>
            </div>

            {/* Action Bar */}
            <div className="flex gap-4 mt-8">
              <a href="/fleet" className="flex-1 bg-cyan-600 text-white py-4 rounded-xl text-center font-bold hover:bg-cyan-500 transition-colors">
                Back to Fleet Dashboard
              </a>
              <a href="/comparison" className="flex-1 bg-amber-600 text-white py-4 rounded-xl text-center font-bold hover:bg-amber-500 transition-colors">
                Compare Vehicles
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper components (client-side)
const DetailsSection = ({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-[#262420] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 text-left hover:bg-[#1a1816] transition-colors flex items-center justify-between"
      >
        <span className="font-bold text-white text-lg">{title}</span>
        <svg className={`w-6 h-6 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 py-4">{children}</div>}
    </div>
  );
};

const MarketChart = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="py-4 space-y-4">
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1816] rounded-lg">
      <span className="text-gray-400">Private Party Low</span>
      <span className="font-bold text-gray-200">${analysis.marketValues?.privatePartyLow?.toLocaleString() || 0}</span>
    </div>
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1816] rounded-lg">
      <span className="text-gray-400">Private Party Avg</span>
      <span className="font-bold text-emerald-400">${analysis.marketValues?.privatePartyAvg?.toLocaleString() || 0}</span>
    </div>
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1816] rounded-lg">
      <span className="text-gray-400">Private Party High</span>
      <span className="font-bold text-gray-200">${analysis.marketValues?.privatePartyHigh?.toLocaleString() || 0}</span>
    </div>
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1816] rounded-lg border border-rose-500/30">
      <span className="text-rose-400 font-bold">Asking Price</span>
      <span className="font-bold text-rose-400">${analysis.marketValues?.dealerRetail ? (analysis.marketValues.dealerRetail - 2000).toLocaleString() : 0}</span>
    </div>
  </div>
);

const ScenarioAnalysis = ({ analysis }: { analysis: AnalysisResult }) => ({
  analysis.scenarios && (
    <div className="grid grid-cols-3 gap-4 py-4">
      {['Best Case', 'Expected', 'Worst Case'].map((sc) => (
        <div key={sc} className="border border-[#262420] rounded-lg p-4">
          <h4 className="font-bold text-white mb-3">{sc}</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Repair:</span> ${analysis.scenarios?.[sc.replace(' Case','')]?.repairCost || 0}</div>
            <div><span className="text-gray-500">Total Cost:</span> ${analysis.scenarios?.[sc.replace(' Case','')]?.totalCost || 0}</div>
            <div><span className="text-gray-500">Equity:</span> ${analysis.scenarios?.[sc.replace(' Case','')]?.equity?.toLocaleString() || 0}</div>
          </div>
        </div>
      ))}
    </div>
  )
} as any);

const BreakEvenPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#1a1816] rounded-lg p-4">
        <div className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Repair Cushion</div>
        <div className="font-bold text-white">${analysis.breakEven?.repairCushion?.toLocaleString() || 0}</div>
      </div>
      <div className="bg-[#1a1816] rounded-lg p-4">
        <div className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Max Repair Budget</div>
        <div className="font-bold text-white">${analysis.breakEven?.maxRepairBudget?.toLocaleString() || 0}</div>
      </div>
    </div>
    <p className="text-sm text-gray-400">{analysis.breakEven?.riskAssessment}</p>
  </div>
);

const InsurancePanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-3 py-4">
    {['Personal Use', 'Rideshare Endorsement', 'Commercial / Full TNC'].map((tier) => (
      <div key={tier} className="border border-[#262420] rounded-lg p-4">
        <h4 className="font-bold text-white mb-2">{tier}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Monthly:</span> ${analysis.insurance?.[tier]?.monthly || 0}</div>
          <div><span className="text-gray-500">Annual:</span> ${analysis.insurance?.[tier]?.annual || 0}</div>
        </div>
      </div>
    ))}
  </div>
);

const OperationalCostsPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="overflow-x-auto py-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#262420]">
          <th className="text-left px-2 py-2 font-bold text-gray-400">Item</th>
          <th className="text-right px-2 py-2 font-bold text-gray-400">Monthly</th>
          <th className="text-right px-2 py-2 font-bold text-gray-400">Annual</th>
        </tr>
      </thead>
      <tbody>
        {['Insurance', 'Fuel', 'Maintenance', 'Depreciation', 'Registration', 'Tolls', 'TOTAL'].map((item) => (
          <tr key={item} className="border-b border-[#262420]">
            <td className="px-2 py-2 text-white">{item}</td>
            <td className="px-2 py-2 text-right">${analysis.operationalCosts?.[item as keyof typeof analysis.operationalCosts]?.monthly?.toLocaleString() || 0}</td>
            <td className="px-2 py-2 text-right">${analysis.operationalCosts?.[item as keyof typeof analysis.operationalCosts]?.annual?.toLocaleString() || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InitialInvestmentPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-2 py-4">
    {[
      { name: 'Purchase Price', required: true, cost: analysis.initialInvestment?.purchase },
      { name: 'Inspection', required: true, cost: analysis.initialInvestment?.inspection },
      { name: 'Detail / Clean', required: false, cost: analysis.initialInvestment?.detail },
      { name: 'Phone Mount', required: false, cost: analysis.initialInvestment?.phoneMount },
      { name: 'First Insurance Payment', required: true, cost: analysis.initialInvestment?.insurance },
      { name: 'Registration', required: true, cost: analysis.initialInvestment?.registration },
    ].map((item, i) => (
      <div key={i} className="flex items-center justify-between border-b border-[#262420] last:border-0 py-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono ${item.required ? 'text-emerald-400' : 'text-gray-600'}`}>{item.required ? '✦' : '○'}</span>
          <span className="text-gray-200">{item.name}</span>
        </div>
        <span className="font-bold text-white">${item.cost?.toLocaleString() || 0}</span>
      </div>
    ))}
  </div>
);

const PaybackPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-4 py-4">
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Conservative', weeks: analysis.paybackWeeks?.conservative },
        { label: 'Baseline', weeks: analysis.paybackWeeks?.baseline },
        { label: 'Optimistic', weeks: analysis.paybackWeeks?.optimistic },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{item.label}</div>
          <div className="text-2xl font-bold text-emerald-400">{item.weeks} weeks</div>
        </div>
      ))}
    </div>
  </div>
);

const NegotiationPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-3 py-4">
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-[#1a1816] rounded-lg p-3 text-center">
        <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Opening Offer</div>
        <div className="font-bold text-white">${analysis.negotiation?.openingOffer}</div>
      </div>
      <div className="bg-[#1a1816] rounded-lg p-3 text-center border-2 border-cyan-500">
        <div className="text-[9px] text-cyan-500 uppercase tracking-widest mb-1">Target Price</div>
        <div className="font-bold text-cyan-400">${analysis.negotiation?.targetPrice}</div>
      </div>
      <div className="bg-[#1a1816] rounded-lg p-3 text-center">
        <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Walk-Away Price</div>
        <div className="font-bold text-rose-400">${analysis.negotiation?.walkAwayPrice}</div>
      </div>
    </div>
    <div>
      <h4 className="font-bold text-white mb-2">Leverage Points</h4>
      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
        {analysis.negotiation?.leveragePoints?.map((lp, i) => (
          <li key={i}>{lp}</li>
        ))}
      </ul>
    </div>
  </div>
);

const ActionPlanPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-4 py-4">
    {analysis.actionPlan?.map((step, i) => (
      <div key={i} className="border-l-4 border-cyan-500 pl-4">
        <div className="font-bold text-white mb-1">Step {i+1}: {step.title}</div>
        <div className="text-sm text-gray-300">{step.description}</div>
      </div>
    ))}
  </div>
);

const ConditionPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <h4 className="font-bold text-white">Exterior Notes</h4>
      <div className="bg-[#1a1816] p-3 rounded text-sm text-gray-300">{analysis.conditionAssessment?.exteriorNotes}</div>
    </div>
    <div className="space-y-2">
      <h4 className="font-bold text-white">Interior Notes</h4>
      <div className="bg-[#1a1816] p-3 rounded text-sm text-gray-300">{analysis.conditionAssessment?.interiorNotes}</div>
    </div>
    <div className="space-y-2">
      <h4 className="font-bold text-white">Mechanical Notes</h4>
      <div className="bg-[#1a1816] p-3 rounded text-sm text-gray-300">{analysis.conditionAssessment?.mechanicalNotes}</div>
    </div>
  </div>
);

const SellerVerificationPanel = ({ analysis }: { analysis: AnalysisResult }) => (
  <div className="py-4 space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <div><span className="text-gray-500">Responsiveness:</span> <span className="text-white">{analysis.sellerVerification?.responsiveness}</span></div>
      <div><span className="text-gray-500">Transparency:</span> <span className="text-white">{analysis.sellerVerification?.transparency}</span></div>
    </div>
    <div>
      <h4 className="font-bold text-white mb-1">Red Flags</h4>
      <div className="text-sm text-rose-400">{analysis.sellerVerification?.redFlags.join(', ')}</div>
    </div>
  </div>
);
