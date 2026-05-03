import type { Vehicle, AnalysisResult } from "./types";
import { getHistory } from "./history";
import { kvGet, kvSet } from "./kv-client";

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

async function buildHistoryContext(): Promise<string> {
    const history = await getHistory();
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

export async function buildSystemPrompt(vehicle: Vehicle, analysis: AnalysisResult): Promise<string> {
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

    const expectedRepairs = (a as any).repairCosts?.repairs
        ?.map((r: any) => `  - ${r.name}: $${r.cost} (${r.category})`)
        ?.join("\n") || "    • No repair cost data available";
    const totalRepairs = (a as any).repairCosts?.repairs?.reduce((sum: number, r: any) => sum + r.cost, 0) || 0;
    const totalCost = (a.rideshare.earnings.baseline as any).totalCost || 'N/A';
    const weeklyNet = a.rideshare.earnings.baseline.weeklyNet;
    const weeklyGross = (a.rideshare.earnings.baseline as any).weeklyGross || 'N/A';
    const paybackWeeks = a.paybackWeeks.baseline;

    const insurance = a.insurance.personalMonthly;
    const marketValues = `
  Private Party Avg: $${a.marketValues.privatePartyAvg.toLocaleString()}
  Dealer Retail: $${a.marketValues.dealerRetail.toLocaleString()}
  Trade-In: $${a.marketValues.tradeIn.toLocaleString()}`;

    const historyContext = await buildHistoryContext();

    return `You are VERA — a Vehicle Equity & Rideshare Advisor. You help users understand vehicle analysis reports, plan purchases, and understand true cost of ownership including rideshare potential.

══ CURRENT VEHICLE ══
${v.year} ${v.make} ${v.model} ${v.trim || ""}
VIN: ${v.vin || "not provided"}
Price: $${v.price.toLocaleString()}
Mileage: ${v.mileage.toLocaleString()} mi
Location: ${v.location || "unknown"}
Listing URL: ${v.listingUrl || "unknown"}
Days Listed: ${(v as any).daysListed || "unknown"}

══ ANALYSIS RESULTS ══
Verdict: ${a.verdict}
Verdict Score: ${a.verdictScore}/100
Instant Equity: ${eq}
Market Values:${marketValues}
Confidence Score: ${a.structuredVerdict?.confidence || "N/A"}%

══ REPAIR COSTS ══
Expected Repairs:
${expectedRepairs}
Total Estimated Repairs: $${totalRepairs.toLocaleString()}

══ CRITICAL ISSUES ══
${issues}
Leverage Points: ${leveragePoints}
Buy If: ${buyIf}

══ RIDESHARE ECONOMICS ══
Weekly Gross: ${typeof weeklyGross === 'number' ? weeklyGross.toLocaleString() : weeklyGross}
Weekly Net: $${weeklyNet.toLocaleString()}
Total First-Year Cost: ${typeof totalCost === 'number' ? totalCost.toLocaleString() : totalCost}
Payback Period: ${paybackWeeks} weeks
Insurance (Monthly): $${insurance.toLocaleString()}

══ SAFETY & RECALLS ══
Open Recalls: ${recallCount}${a.vinAnalysis?.safety.recalls?.length ? " — " + (a.vinAnalysis.safety.recalls.map((r: any) => r.Summary || r.description || '').join("; ")) : ""}
Maintenance Records: ${maintCount}

══ NEGOTIATION STRATEGY ══
Recommended Offer: ${a.negotiation.openingOffer || "N/A"}
Walk-away Price: ${a.negotiation.walkAwayPrice || "N/A"}
Negotiation Target: ${a.negotiation.targetPrice || "N/A"}

══ ANALYSIS HISTORY ══
${historyContext}

══ BEHAVIOR RULES ══
- Use the data above AS FACT. Do not question or doubt it.
- Answer questions specifically about THIS vehicle using the data provided.
- When comparing to history, use the vehicle list above and rank by the user's stated criteria.
- When the user asks "what if" questions, do the math inline based on the analysis data.
- Keep responses well-structured with headers or bullet points where helpful.
- Never say "I don't have access to real-time data" — use the data you have and note limitations precisely.
- Suggest 2-3 follow-up questions at the END of each response, formatted as:
  FOLLOW_UPS: ["question 1", "question 2", "question 3"]`;
}

// ── KV-backed chat persistence (was localStorage) ──

const CHAT_STORAGE_KEY = "vera_chat_sessions";

export async function saveChatSession(vehicleId: string, messages: ChatMessage[]): Promise<void> {
    try {
        const existing = (await kvGet<Record<string, ChatSession>>(CHAT_STORAGE_KEY)) || {};
        existing[vehicleId] = { vehicleId, messages };
        await kvSet(CHAT_STORAGE_KEY, existing);
    } catch (e) {
        console.error("Failed to save chat session", e);
    }
}

export async function loadChatSession(vehicleId: string): Promise<ChatMessage[]> {
    try {
        const existing = (await kvGet<Record<string, ChatSession>>(CHAT_STORAGE_KEY)) || {};
        return existing[vehicleId]?.messages || [];
    } catch {
        return [];
    }
}

export async function clearChatSession(vehicleId: string): Promise<void> {
    try {
        const existing = (await kvGet<Record<string, ChatSession>>(CHAT_STORAGE_KEY)) || {};
        delete existing[vehicleId];
        await kvSet(CHAT_STORAGE_KEY, existing);
    } catch (e) {
        console.error("Failed to clear chat session", e);
    }
}

// ── Parse follow-ups out of model response ──

export function parseFollowUps(text: string): { clean: string; followUps: string[] } {
    const marker = "FOLLOW_UPS:";
    const idx = text.lastIndexOf(marker);
    if (idx === -1) return { clean: text.trim(), followUps: [] };

    try {
        const before = text.slice(0, idx).trim();
        const after = text.slice(idx + marker.length).trim();
        // Find JSON array
        const bracketStart = after.indexOf("[");
        const bracketEnd = after.lastIndexOf("]");
        if (bracketStart !== -1 && bracketEnd !== -1) {
            const jsonStr = after.slice(bracketStart, bracketEnd + 1);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
                return { clean: before, followUps: parsed.slice(0, 4) };
            }
        }
        return { clean: text.trim(), followUps: [] };
    } catch {
        return { clean: text.trim(), followUps: [] };
    }
}

// ── Vehicle ID generator for KV session keys ──
export function makeVehicleId(vehicle: Vehicle): string {
    const year = vehicle.year || 'unknown';
    const make = (vehicle.make || 'unknown').replace(/\s+/g, '-');
    const model = (vehicle.model || 'unknown').replace(/\s+/g, '-');
    return `${year}-${make}-${model}`.toLowerCase();
}
