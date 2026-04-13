import type { Vehicle, AnalysisResult } from "./types";
import { getHistory } from "./history";

// ── Chat message types ──

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    followUps?: string[];
}

export interface ChatSession {
    vehicleId: string; // timestamp-based ID
    messages: ChatMessage[];
}

// ── Prompt starters mapped to quick actions ──

export const PROMPT_STARTERS = [
    { id: "explain-verdict",   label: "Explain the verdict",          prompt: "Explain the verdict for this vehicle in plain language. What drove the score?" },
    { id: "negotiation-script", label: "Write my negotiation script", prompt: "Write me a ready-to-send negotiation message I can text or email to the seller right now. Use the actual numbers from the analysis." },
    { id: "year1-cost",        label: "Show my true year-1 cost",     prompt: "Calculate every dollar this car will cost me in the first 12 months — purchase price, estimated repairs, insurance, operational costs, registration, startup items — give me the real total." },
    { id: "red-flag-dive",     label: "Deep dive the top red flag",   prompt: "Walk me through the most serious red flag detected in this analysis. What's the best case and worst case behind it, and what should I check?" },
    { id: "compare-history",   label: "Compare to my saved vehicles", prompt: "Compare this vehicle to all other vehicles I have saved in history. Rank them by which is the best deal overall." },
    { id: "rideshare-verdict", label: "Is this a good rideshare car?", prompt: "Give me a straight answer: is this a good rideshare car? Break down eligibility, realistic weekly net profit after ALL expenses, and how long before I'm profitable." },
    { id: "seller-questions",  label: "What should I ask the seller?", prompt: "Give me a list of the 10 most important questions I should ask this seller before agreeing to anything. Base them on this specific vehicle's analysis and red flags." },
    { id: "post-purchase",     label: "I bought it — what now?",      prompt: "I just bought this vehicle. Walk me through the first week: immediate actions, recall repair steps, mileage milestones, rideshare onboarding checklist, and maintenance schedule." },
    { id: "confidence-score",  label: "Why is the confidence X%?",   prompt: "Explain exactly why the analysis confidence score is what it is. What data points increased or decreased it? What would raise it to 99%?" },
    { id: "seller-psychology", label: "Read the seller's psychology", prompt: "Based on the listing data — days posted, price vs market, seller responsiveness, transparency score, and description — what is this seller's likely motivation? Should I trust them?" },
    { id: "depreciation-curve", label: "Depreciation & resale value", prompt: "Project this vehicle's resale value over the next 1, 2, and 3 years based on current market data and depreciation rate. Show me the annual dollar loss." },
    { id: "market-timing",     label: "Is now a good time to buy?",   prompt: "Is right now a good time to buy this type of vehicle? Consider current used car market conditions, this vehicle's equity position, and whether waiting would get me a better deal." },
] as const;

export type PromptStarterId = typeof PROMPT_STARTERS[number]["id"];

// ── History summary for cross-vehicle comparison ──

function buildHistoryContext(): string {
    const history = getHistory();
    if (history.length === 0) return "No other vehicles in analysis history.";

    const lines = history.slice(0, 10).map((entry, i) => {
        const v = entry.vehicle;
        const a = entry.analysis;
        const eq = a.instantEquity >= 0 ? `+$${a.instantEquity.toLocaleString()}` : `-$${Math.abs(a.instantEquity).toLocaleString()}`;
        return `  ${i + 1}. ${v.year} ${v.make} ${v.model} — $${v.price.toLocaleString()}, ${v.mileage.toLocaleString()} mi, Equity: ${eq}, Verdict: ${a.verdict}, Score: ${a.verdictScore}/100, Payback: ${a.paybackWeeks.baseline}w, Net/wk: $${a.rideshare.earnings.baseline.weeklyNet}`;
    });

    return `Saved vehicle history (${history.length} total):\n${lines.join("\n")}`;
}

// ── Main context builder ──

export function buildSystemPrompt(vehicle: Vehicle, analysis: AnalysisResult): string {
    const v = vehicle;
    const a = analysis;
    const eq = a.instantEquity >= 0
        ? `+$${a.instantEquity.toLocaleString()} (good equity position)`
        : `-$${Math.abs(a.instantEquity).toLocaleString()} (upside-down before repairs)`;

    const recallCount = a.vinAnalysis?.safety.recalls?.length ?? "not run";
    const maintCount = a.vinAnalysis?.history.maintenance?.length ?? "not run";
    const issues = a.criticalIssues.length > 0
        ? a.criticalIssues.map(i => `    • [${i.severity.toUpperCase()}] ${i.title}: ${i.concern}`).join("\n")
        : "    • None detected";

    const leveragePoints = a.negotiation.leveragePoints.join("; ");
    const buyIf = a.structuredVerdict.buyIf.slice(0, 3).join("; ");
    const walkAway = a.structuredVerdict.walkAwayIf.slice(0, 3).join("; ");

    const historyContext = buildHistoryContext();

    return `You are VERA (Vehicle Evaluation & Research Assistant), an expert automotive analyst embedded in Vehicle Analyzer Pro. You are confident, direct, and data-driven. You never give generic advice — every answer is specific to this vehicle's analysis data.

━━━ ACTIVE VEHICLE ━━━
Vehicle: ${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}
Asking Price: $${v.price.toLocaleString()}
Mileage: ${v.mileage.toLocaleString()} miles
VIN: ${v.vin || "Not provided"}
Location: ${v.location || "Not specified"}
Title: ${v.titleStatus || "Unknown"}
Source: ${v.source || "Manual entry"}
Fuel: ${v.fuelType || "Unknown"} | Trans: ${v.transmission || "Unknown"}
Seller: ${v.sellerName || "Unknown"} | Responsiveness: ${v.sellerResponsiveness || "not-contacted"} | Transparency: ${v.sellerTransparency || "not-assessed"}
${v.sellerRedFlags ? `Seller Red Flags: ${v.sellerRedFlags}` : ""}
${v.description ? `Listing Description: "${v.description.slice(0, 400)}${v.description.length > 400 ? "..." : ""}"` : ""}

━━━ VERDICT & SCORING ━━━
Verdict: ${a.verdict}
Score: ${a.verdictScore}/100
Confidence: ${a.structuredVerdict.confidence}%
Instant Equity: ${eq}

━━━ CRITICAL ISSUES (${a.criticalIssues.length}) ━━━
${issues}

━━━ MARKET VALUES ━━━
Private Party Low: $${a.marketValues.privatePartyLow.toLocaleString()}
Private Party Avg: $${a.marketValues.privatePartyAvg.toLocaleString()}
Private Party High: $${a.marketValues.privatePartyHigh.toLocaleString()}
Dealer Retail: $${a.marketValues.dealerRetail.toLocaleString()}
Trade-In: $${a.marketValues.tradeIn.toLocaleString()}

━━━ NEGOTIATION STRATEGY ━━━
Opening Offer: $${a.negotiation.openingOffer.toLocaleString()}
Target Price: $${a.negotiation.targetPrice.toLocaleString()}
Walk-Away Price: $${a.negotiation.walkAwayPrice.toLocaleString()}
Leverage: ${leveragePoints}
Price Analysis: ${a.negotiation.priceAnalysis}

━━━ RIDESHARE ━━━
UberX: ${a.rideshare.eligibility.uberX.eligible ? "✓ Eligible" : "✗ " + a.rideshare.eligibility.uberX.reason}
UberComfort: ${a.rideshare.eligibility.uberComfort.eligible ? "✓ Eligible" : "✗ " + a.rideshare.eligibility.uberComfort.reason}
UberXL: ${a.rideshare.eligibility.uberXL.eligible ? "✓ Eligible" : "✗ " + a.rideshare.eligibility.uberXL.reason}
Weekly Net — Conservative: $${a.rideshare.earnings.conservative.weeklyNet} | Baseline: $${a.rideshare.earnings.baseline.weeklyNet} | Optimistic: $${a.rideshare.earnings.optimistic.weeklyNet}
Payback — Conservative: ${a.paybackWeeks.conservative}w | Baseline: ${a.paybackWeeks.baseline}w | Optimistic: ${a.paybackWeeks.optimistic}w

━━━ FINANCIALS ━━━
Insurance (Personal/mo): $${a.insurance.personalMonthly} | Rideshare/mo: $${a.insurance.rideshareMonthly} | Commercial/mo: $${a.insurance.commercialMonthly}
Operational Costs (Monthly): $${a.operationalCosts.totalMonthly} | Annual: $${a.operationalCosts.totalAnnual}
Initial Investment Total (All): $${a.initialInvestment.totalAll.toLocaleString()} | Required Only: $${a.initialInvestment.totalRequired.toLocaleString()}
Break-Even Repair Budget: $${a.breakEven.repairCushion?.toLocaleString() ?? "N/A"}

━━━ VIN / ANTIGRAVITY ENGINE ━━━
${a.vinAnalysis ? `VIN Score: ${a.vinAnalysis.verdict.score}/100 | Recommendation: ${a.vinAnalysis.verdict.recommendation}
Recalls: ${recallCount} | Maintenance Records: ${maintCount}
${a.vinAnalysis.verdict.alerts.length > 0 ? `Alerts: ${a.vinAnalysis.verdict.alerts.join(", ")}` : "No critical alerts"}` : "VIN analysis not run (no VIN provided or not yet analyzed)"}

━━━ BUY / WALK AWAY ━━━
Buy If: ${buyIf}
Walk Away If: ${walkAway}

━━━ ${historyContext} ━━━

━━━ INSTRUCTIONS ━━━
- Answer in a confident, direct, expert tone. No hedging, no filler.
- Always cite specific numbers from this analysis.
- When writing negotiation scripts, make them ready-to-send (no placeholders).
- When comparing to history, use the vehicle list above and rank by the user's stated criteria.
- When the user asks "what if" questions, do the math inline based on the analysis data.
- Keep responses well-structured with headers or bullet points where helpful.
- Never say "I don't have access to real-time data" — use the data you have and note limitations precisely.
- Suggest 2-3 follow-up questions at the END of each response, formatted as:
  FOLLOW_UPS: ["question 1", "question 2", "question 3"]`;
}

// ── LocalStorage chat persistence ──

const CHAT_STORAGE_KEY = "vera_chat_sessions";

export function saveChatSession(vehicleId: string, messages: ChatMessage[]): void {
    if (typeof window === "undefined") return;
    try {
        const existing = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "{}");
        existing[vehicleId] = { vehicleId, messages };
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
        console.error("Failed to save chat session", e);
    }
}

export function loadChatSession(vehicleId: string): ChatMessage[] {
    if (typeof window === "undefined") return [];
    try {
        const existing = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "{}");
        return existing[vehicleId]?.messages || [];
    } catch {
        return [];
    }
}

export function clearChatSession(vehicleId: string): void {
    if (typeof window === "undefined") return;
    try {
        const existing = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "{}");
        delete existing[vehicleId];
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
        console.error("Failed to clear chat session", e);
    }
}

// ── Parse follow-ups out of model response ──

export function parseFollowUps(text: string): { clean: string; followUps: string[] } {
    const marker = "FOLLOW_UPS:";
    const idx = text.lastIndexOf(marker);
    if (idx === -1) return { clean: text.trim(), followUps: [] };

    const clean = text.slice(0, idx).trim();
    try {
        const raw = text.slice(idx + marker.length).trim();
        const followUps = JSON.parse(raw);
        if (Array.isArray(followUps)) return { clean, followUps: followUps.slice(0, 3) };
    } catch {
        // ignore parse error
    }
    return { clean, followUps: [] };
}

// ── Vehicle ID (for session keying) ──
export function makeVehicleId(vehicle: Vehicle): string {
    return `${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.price}-${vehicle.mileage}`.replace(/\s+/g, "_");
}
