"use client";

import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Shield,
    DollarSign,
    CarFront,
    Download,
    ChevronDown,
    ChevronUp,
    Target,
    Scale,
    Wallet,
    PiggyBank,
    Clock,
    ClipboardList,
    Handshake,
    Gavel,
    ClipboardCheck,
    UserSearch,
} from "lucide-react";
import { useState } from "react";
import type { Vehicle, AnalysisResult } from "@/lib/types";
import MarketChart from "./MarketChart";
import RidesharePanel from "./RidesharePanel";
import InsurancePanel from "./InsurancePanel";
import IssueCard from "./IssueCard";
import ScenarioAnalysisPanel from "./ScenarioAnalysisPanel";
import BreakEvenPanel from "./BreakEvenPanel";
import OperationalCostsPanel from "./OperationalCostsPanel";
import InitialInvestmentPanel from "./InitialInvestmentPanel";
import PaybackPanel from "./PaybackPanel";
import ActionPlanPanel from "./ActionPlanPanel";
import NegotiationPanel from "./NegotiationPanel";
import FinalVerdictPanel from "./FinalVerdictPanel";
import ConditionPanel from "./ConditionPanel";
import SellerVerificationPanel from "./SellerVerificationPanel";

import type { AnalysisMode } from "@/app/page";

interface AnalysisResultsProps {
    vehicle: Vehicle;
    analysis: AnalysisResult;
    mode?: AnalysisMode;
}

import AnalysisInspector from "./AnalysisInspector";

export default function AnalysisResults({ vehicle, analysis, mode = "rideshare" }: AnalysisResultsProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>("verdict-final");
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    const equity = analysis.instantEquity;
    const isPositiveEquity = equity > 0;

    const verdictColors: Record<string, string> = {
        "🔥 STRONG BUY": "var(--color-verdict-strong)",
        "✅ RECOMMENDED": "var(--color-verdict-recommended)",
        "⚠️ PROCEED WITH CAUTION": "var(--color-verdict-caution)",
        "🚫 AVOID": "var(--color-verdict-avoid)",
    };

    const verdictColor = verdictColors[analysis.verdict] || "var(--color-text-secondary)";

    const handleDownloadReport = () => {
        const report = generateTextReport(vehicle, analysis);
        const blob = new Blob([report], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${vehicle.year}_${vehicle.make}_${vehicle.model}_Analysis.txt`.replace(/\s+/g, "_");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="space-y-6" id="analysis-results">
            <AnalysisInspector
                isOpen={isInspectorOpen}
                onClose={() => setIsInspectorOpen(false)}
                analysis={analysis}
                vehicle={vehicle}
            />

            {/* ====== VERDICT BANNER ====== */}
            <div
                className="glass-card p-6 sm:p-8 animate-[pulse-glow_2s_ease-in-out_infinite]"
                style={{ borderColor: verdictColor + "33" }}
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider mb-1 flex items-center gap-2">
                            Verdict
                            <button
                                onClick={() => setIsInspectorOpen(true)}
                                className="text-[var(--color-accent-purple)] hover:text-[var(--color-text-primary)] transition-colors"
                                title="View Scoring Logic & Raw Data"
                            >
                                <Scale className="w-4 h-4" />
                            </button>
                        </p>
                        <h2
                            className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase"
                            style={{ color: verdictColor }}
                        >
                            {analysis.verdict}
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                            {vehicle.trim ? ` ${vehicle.trim}` : ""}
                            {vehicle.location ? ` • ${vehicle.location}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsInspectorOpen(true)}
                            className="btn-secondary flex items-center gap-2 text-xs"
                        >
                            <Scale className="w-4 h-4" />
                            Why?
                        </button>
                        <button
                            onClick={handleDownloadReport}
                            className="btn-secondary flex items-center gap-2"
                            id="download-report-btn"
                        >
                            <Download className="w-4 h-4" />
                            Download Report
                        </button>
                    </div>
                </div>
            </div>

            {/* ====== METRIC CARDS ====== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 [&>div]:animate-[fade-in_0.6s_ease-out_both]">
                <div className="metric-card shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" style={{ animationDelay: "100ms" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-xs font-mono tracking-widest text-[var(--color-text-muted)] uppercase">
                            Asking Price
                        </span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                        ${vehicle.price.toLocaleString()}
                    </p>
                </div>

                <div className="metric-card shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" style={{ animationDelay: "200ms" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <CarFront className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-xs font-mono tracking-widest text-[var(--color-text-muted)] uppercase">
                            Market Value
                        </span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                        ${analysis.marketValues.privatePartyAvg.toLocaleString()}
                    </p>
                </div>

                <div className="metric-card shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" style={{ animationDelay: "300ms" }}>
                    <div className="flex items-center gap-2 mb-2">
                        {isPositiveEquity ? (
                            <TrendingUp className="w-4 h-4 text-[var(--color-accent-lime)]" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-[var(--color-accent-rose)]" />
                        )}
                        <span className="text-xs font-mono tracking-widest text-[var(--color-text-muted)] uppercase">
                            Instant Equity
                        </span>
                    </div>
                    <p
                        className="text-2xl font-bold font-mono drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                        style={{
                            color: isPositiveEquity
                                ? "var(--color-accent-lime)"
                                : "var(--color-accent-rose)",
                        }}
                    >
                        {isPositiveEquity ? "+" : ""}${equity.toLocaleString()}
                    </p>
                </div>

                <div className="metric-card shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" style={{ animationDelay: "400ms" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-xs font-mono tracking-widest text-[var(--color-text-muted)] uppercase">
                            Issues Found
                        </span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                        {analysis.criticalIssues.length}
                    </p>
                </div>
            </div>

            {/* ====== 1. FINAL VERDICT (Buy If / Walk Away If) ====== */}
            <CollapsibleSection
                title="Final Verdict"
                icon={<Gavel className="w-5 h-5" />}
                isExpanded={expandedSection === "verdict-final"}
                onToggle={() => toggleSection("verdict-final")}
            >
                <FinalVerdictPanel structuredVerdict={analysis.structuredVerdict} />
            </CollapsibleSection>

            {/* ====== 2. MARKET VALUE COMPARISON ====== */}
            <CollapsibleSection
                title="Market Value Comparison"
                icon={<DollarSign className="w-5 h-5" />}
                isExpanded={expandedSection === "market"}
                onToggle={() => toggleSection("market")}
            >
                <MarketChart marketValues={analysis.marketValues} askingPrice={vehicle.price} />
            </CollapsibleSection>

            {/* ====== 3. CRITICAL ISSUES ====== */}
            <CollapsibleSection
                title={`Critical Issues (${analysis.criticalIssues.length})`}
                icon={<AlertTriangle className="w-5 h-5" />}
                isExpanded={expandedSection === "issues"}
                onToggle={() => toggleSection("issues")}
            >
                <div className="space-y-3">
                    {analysis.criticalIssues.map((issue, idx) => (
                        <IssueCard key={idx} issue={issue} index={idx + 1} />
                    ))}
                </div>
            </CollapsibleSection>

            {/* ====== 3b. VIN HISTORY & RECALLS (If extracted) ====== */}
            {analysis.vinAnalysis && (
                <CollapsibleSection
                    title={`Vehicle History & Records (${analysis.vinAnalysis.history.maintenance.length} Events)`}
                    icon={<ClipboardList className="w-5 h-5" />}
                    isExpanded={expandedSection === "history"}
                    onToggle={() => toggleSection("history")}
                >
                    <div className="space-y-6">
                        {/* Recalls */}
                        {analysis.vinAnalysis.safety.recalls.length > 0 ? (
                            <div className="p-4 rounded-xl border border-[var(--color-accent-rose)] bg-rose-500/10">
                                <h4 className="text-sm font-bold text-[var(--color-accent-rose)] mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {analysis.vinAnalysis.safety.recalls.length} Open NHTSA Recalls
                                </h4>
                                <ul className="space-y-3">
                                    {analysis.vinAnalysis.safety.recalls.map((r: any, idx: number) => (
                                        <li key={idx} className="text-sm">
                                            <p className="font-semibold text-[var(--color-text-primary)]">{r.affected_component}</p>
                                            <p className="text-[var(--color-text-secondary)] mt-1">{r.description}</p>
                                            {r.remedy_action && (
                                                <p className="text-[var(--color-text-muted)] mt-1 text-xs"><span className="font-medium">Remedy:</span> {r.remedy_action}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border border-[var(--color-accent-emerald)] bg-emerald-500/10 flex items-center gap-3">
                                <Shield className="w-5 h-5 text-[var(--color-accent-emerald)]" />
                                <span className="text-sm font-medium text-[var(--color-accent-emerald)]">No open recalls detected.</span>
                            </div>
                        )}

                        {/* Maintenance History */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Service History Timeline</h4>
                            {analysis.vinAnalysis.history.maintenance.length > 0 ? (
                                <div className="space-y-3 border-l-2 border-[var(--color-border-subtle)] ml-3 pl-4">
                                    {analysis.vinAnalysis.history.maintenance.map((m: any, idx: number) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-[var(--color-accent-indigo)]" />
                                            {m.error ? (
                                                <p className="text-sm text-[var(--color-accent-rose)] font-medium">{m.error}</p>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-semibold text-[var(--color-accent-indigo)]">{m.date} {m.mileage ? `— ${m.mileage.toLocaleString()} mi` : ""}</p>
                                                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{m.description}</p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--color-text-muted)] italic">No service history records found for this VIN.</p>
                            )}
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            {/* ====== 4. SCENARIO ANALYSIS ====== */}
            <CollapsibleSection
                title="Scenario-Based Financial Analysis"
                icon={<Target className="w-5 h-5" />}
                isExpanded={expandedSection === "scenarios"}
                onToggle={() => toggleSection("scenarios")}
            >
                <ScenarioAnalysisPanel scenarios={analysis.scenarios} askingPrice={vehicle.price} />
            </CollapsibleSection>

            {/* ====== 5. BREAK-EVEN ANALYSIS ====== */}
            <CollapsibleSection
                title="Break-Even Analysis"
                icon={<Scale className="w-5 h-5" />}
                isExpanded={expandedSection === "breakeven"}
                onToggle={() => toggleSection("breakeven")}
            >
                <BreakEvenPanel breakEven={analysis.breakEven} />
            </CollapsibleSection>

            {/* ====== 6. INSURANCE ESTIMATES ====== */}
            <CollapsibleSection
                title="Insurance Cost Estimates"
                icon={<Shield className="w-5 h-5" />}
                isExpanded={expandedSection === "insurance"}
                onToggle={() => toggleSection("insurance")}
            >
                <InsurancePanel insurance={analysis.insurance} />
            </CollapsibleSection>

            {/* ====== 7. OPERATIONAL COST BREAKDOWN ====== */}
            <CollapsibleSection
                title="Operational Cost Breakdown"
                icon={<Wallet className="w-5 h-5" />}
                isExpanded={expandedSection === "opcosts"}
                onToggle={() => toggleSection("opcosts")}
            >
                <OperationalCostsPanel costs={analysis.operationalCosts} />
            </CollapsibleSection>

            {/* ====== 8. INITIAL INVESTMENT (Rideshare only) ====== */}
            {mode === "rideshare" && (
                <CollapsibleSection
                    title="Initial Investment Required"
                    icon={<PiggyBank className="w-5 h-5" />}
                    isExpanded={expandedSection === "investment"}
                    onToggle={() => toggleSection("investment")}
                >
                    <InitialInvestmentPanel investment={analysis.initialInvestment} />
                </CollapsibleSection>
            )}

            {/* ====== 9. ROI & PAYBACK TIMELINE (Rideshare only) ====== */}
            {mode === "rideshare" && (
                <CollapsibleSection
                    title="ROI & Payback Timeline"
                    icon={<Clock className="w-5 h-5" />}
                    isExpanded={expandedSection === "payback"}
                    onToggle={() => toggleSection("payback")}
                >
                    <PaybackPanel
                        paybackWeeks={analysis.paybackWeeks}
                        vehiclePrice={vehicle.price}
                        weeklyEarnings={{
                            conservative: analysis.rideshare.earnings.conservative.weeklyNet,
                            baseline: analysis.rideshare.earnings.baseline.weeklyNet,
                            optimistic: analysis.rideshare.earnings.optimistic.weeklyNet,
                        }}
                    />
                </CollapsibleSection>
            )}

            {/* ====== 10. RIDESHARE ANALYSIS (Rideshare only) ====== */}
            {mode === "rideshare" && (
                <CollapsibleSection
                    title="Rideshare Eligibility & Earnings"
                    icon={<CarFront className="w-5 h-5" />}
                    isExpanded={expandedSection === "rideshare"}
                    onToggle={() => toggleSection("rideshare")}
                >
                    <RidesharePanel
                        eligibility={analysis.rideshare.eligibility}
                        earnings={analysis.rideshare.earnings}
                        vehiclePrice={vehicle.price}
                    />
                </CollapsibleSection>
            )}

            {/* ====== 11. NEGOTIATION STRATEGY ====== */}
            <CollapsibleSection
                title="Negotiation Strategy"
                icon={<Handshake className="w-5 h-5" />}
                isExpanded={expandedSection === "negotiation"}
                onToggle={() => toggleSection("negotiation")}
            >
                <NegotiationPanel negotiation={analysis.negotiation} askingPrice={vehicle.price} />
            </CollapsibleSection>

            {/* ====== 12. PRE-PURCHASE ACTION PLAN ====== */}
            <CollapsibleSection
                title="Pre-Purchase Action Plan"
                icon={<ClipboardList className="w-5 h-5" />}
                isExpanded={expandedSection === "actionplan"}
                onToggle={() => toggleSection("actionplan")}
            >
                <ActionPlanPanel actionPlan={analysis.actionPlan} />
            </CollapsibleSection>

            {/* ====== 13. CONDITION ASSESSMENT ====== */}
            <CollapsibleSection
                title="Condition Assessment"
                icon={<ClipboardCheck className="w-5 h-5" />}
                isExpanded={expandedSection === "condition"}
                onToggle={() => toggleSection("condition")}
            >
                <ConditionPanel condition={analysis.conditionAssessment} />
            </CollapsibleSection>

            {/* ====== 14. SELLER VERIFICATION ====== */}
            <CollapsibleSection
                title="Seller Verification"
                icon={<UserSearch className="w-5 h-5" />}
                isExpanded={expandedSection === "seller"}
                onToggle={() => toggleSection("seller")}
            >
                <SellerVerificationPanel seller={analysis.sellerVerification} />
            </CollapsibleSection>
        </div>
    );
}

/* ====== COLLAPSIBLE SECTION ====== */

function CollapsibleSection({
    title,
    icon,
    isExpanded,
    onToggle,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-[var(--color-bg-glass-hover)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="text-[var(--color-accent-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]">{icon}</div>
                    <h3 className="text-sm font-mono tracking-widest uppercase font-bold text-[var(--color-text-primary)]">
                        {title}
                    </h3>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
            </button>
            {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 animate-[slide-down_0.3s_ease-out]">
                    {children}
                </div>
            )}
        </div>
    );
}

/* ====== TEXT REPORT GENERATOR ====== */

function generateTextReport(vehicle: Vehicle, analysis: AnalysisResult): string {
    const mv = analysis.marketValues;
    const n = analysis.negotiation;
    const sv = analysis.structuredVerdict;

    const lines = [
        `════════════════════════════════════════════════`,
        `  VEHICLE ANALYSIS REPORT`,
        `  Generated: ${new Date().toLocaleDateString()}`,
        `════════════════════════════════════════════════`,
        ``,
        `─── VEHICLE ───`,
        `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`,
        `Price: $${vehicle.price.toLocaleString()}`,
        `Mileage: ${vehicle.mileage.toLocaleString()} mi`,
        `Location: ${vehicle.location || "N/A"}`,
        `Title: ${vehicle.titleStatus || "N/A"}`,
        `VIN: ${vehicle.vin || "N/A"}`,
        `Transmission: ${vehicle.transmission || "N/A"}`,
        `Fuel Type: ${vehicle.fuelType || "N/A"}`,
        `Source: ${vehicle.source || "N/A"}`,
        ``,
        `─── VERDICT ───`,
        `${analysis.verdict}  (Score: ${analysis.verdictScore}/100, Confidence: ${sv.confidence}%)`,
        `Instant Equity: ${equity_str(analysis.instantEquity)}`,
        ``,
        `  ✅ BUY IF:`,
        ...sv.buyIf.map((c) => `    • ${c}`),
        ``,
        `  🚫 WALK AWAY IF:`,
        ...sv.walkAwayIf.map((c) => `    • ${c}`),
        ``,
        ...(sv.redFlags.length > 0 ? [`  ⚠️ RED FLAGS: ${sv.redFlags.join(", ")}`, ``] : []),
        `─── MARKET VALUES ───`,
        `Private Party Low:  $${mv.privatePartyLow.toLocaleString()}`,
        `Private Party Avg:  $${mv.privatePartyAvg.toLocaleString()}`,
        `Private Party High: $${mv.privatePartyHigh.toLocaleString()}`,
        `Dealer Retail:      $${mv.dealerRetail.toLocaleString()}`,
        `Trade-In:           $${mv.tradeIn.toLocaleString()}`,
        ``,
        `─── CRITICAL ISSUES (${analysis.criticalIssues.length}) ───`,
        ...analysis.criticalIssues.map(
            (issue, i) =>
                `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}\n   ${issue.concern}\n   Action: ${issue.action}`
        ),
        ``,
        `─── SCENARIO ANALYSIS ───`,
        ...analysis.scenarios.scenarios.map(
            (s) => `${s.label}: Repairs $${s.repairCost.toLocaleString()} → Total $${s.totalCost.toLocaleString()} → Equity ${equity_str(s.equityAfterRepairs)}`
        ),
        ``,
        `─── BREAK-EVEN ───`,
        `Repair Cushion: ${equity_str(analysis.breakEven.repairCushion)}`,
        `Max Repair Budget: $${analysis.breakEven.maxRepairBudget.toLocaleString()}`,
        `Assessment: ${analysis.breakEven.riskAssessment}`,
        ``,
        `─── INSURANCE ───`,
        `Personal:   $${analysis.insurance.personalMonthly}/mo ($${analysis.insurance.personalAnnual}/yr)`,
        `Rideshare:  $${analysis.insurance.rideshareMonthly}/mo ($${analysis.insurance.rideshareAnnual}/yr)`,
        `Commercial: $${analysis.insurance.commercialMonthly}/mo ($${analysis.insurance.commercialAnnual}/yr)`,
        ``,
        `─── OPERATIONAL COSTS ───`,
        ...analysis.operationalCosts.expenses.map(
            (e) => `${e.category}: $${e.monthly}/mo ($${e.annual}/yr) — ${e.notes}`
        ),
        `TOTAL: $${analysis.operationalCosts.totalMonthly}/mo ($${analysis.operationalCosts.totalAnnual}/yr)`,
        `Cost Per Mile: $${analysis.operationalCosts.costPerMile}`,
        ``,
        `─── INITIAL INVESTMENT ───`,
        ...analysis.initialInvestment.items.map(
            (i) => `${i.required ? "✦" : "○"} ${i.item}: $${i.cost.toLocaleString()} — ${i.notes}`
        ),
        `Required Total: $${analysis.initialInvestment.totalRequired.toLocaleString()}`,
        `All-In Total:   $${analysis.initialInvestment.totalAll.toLocaleString()}`,
        ``,
        `─── RIDESHARE PAYBACK ───`,
        `Conservative: ${analysis.paybackWeeks.conservative} weeks`,
        `Baseline:     ${analysis.paybackWeeks.baseline} weeks`,
        `Optimistic:   ${analysis.paybackWeeks.optimistic} weeks`,
        ``,
        `─── RIDESHARE EARNINGS (Baseline) ───`,
        `Weekly Net:  $${analysis.rideshare.earnings.baseline.weeklyNet.toFixed(2)}`,
        `Quarterly:   $${analysis.rideshare.earnings.baseline.week13.toLocaleString()}`,
        `Annual:      $${analysis.rideshare.earnings.baseline.week52.toLocaleString()}`,
        ``,
        `─── NEGOTIATION STRATEGY ───`,
        `Opening Offer: $${n.openingOffer.toLocaleString()}`,
        `Target Price:  $${n.targetPrice.toLocaleString()}`,
        `Walk-Away:     $${n.walkAwayPrice.toLocaleString()}`,
        `Potential Savings: $${n.savingsIfSuccessful.toLocaleString()}`,
        ``,
        `Leverage Points:`,
        ...n.leveragePoints.map((p) => `  • ${p}`),
        ``,
        `─── ACTION PLAN ───`,
        ...analysis.actionPlan.steps.map(
            (s) => `${s.step}. ${s.title}\n   ${s.description}`
        ),
        ``,
        `─── CONDITION ASSESSMENT ───`,
        ...(analysis.conditionAssessment.exteriorNotes ? [`Exterior: ${analysis.conditionAssessment.exteriorNotes}`] : []),
        ...(analysis.conditionAssessment.interiorNotes ? [`Interior: ${analysis.conditionAssessment.interiorNotes}`] : []),
        ...(analysis.conditionAssessment.mechanicalNotes ? [`Mechanical: ${analysis.conditionAssessment.mechanicalNotes}`] : []),
        `Expected Condition Checklist:`,
        ...analysis.conditionAssessment.expectedChecklist.map(
            (item) => `  ${item.item}: ${item.expected}${item.notes ? ` — ${item.notes}` : ""}`
        ),
        ``,
        `─── SELLER VERIFICATION ───`,
        `Contacted: ${analysis.sellerVerification.contacted ? "Yes" : "No"}`,
        `Responsiveness: ${analysis.sellerVerification.responsiveness}`,
        `Transparency: ${analysis.sellerVerification.transparency}`,
        ...(analysis.sellerVerification.redFlags.length > 0 ? [`Red Flags: ${analysis.sellerVerification.redFlags.join(", ")}`] : []),
        ...(analysis.sellerVerification.sellerQuotes ? [`Seller Quotes: "${analysis.sellerVerification.sellerQuotes}"`] : []),
        ``,
        `════════════════════════════════════════════════`,
        `  END OF REPORT`,
        `════════════════════════════════════════════════`,
    ];

    return lines.join("\n");
}

function equity_str(amount: number): string {
    return amount >= 0
        ? `+$${amount.toLocaleString()}`
        : `-$${Math.abs(amount).toLocaleString()}`;
}
