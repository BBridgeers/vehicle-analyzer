// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Vehicle {
    year: number;
    make: string;
    model: string;
    trim?: string;
    price: number;
    mileage: number;
    vin?: string;
    location?: string;
    titleStatus?: string;
    seats?: number;
    exteriorColor?: string;
    interiorColor?: string;
    transmission?: string;
    fuelType?: string;
    source?: string;
    listingUrl?: string;
    description?: string;
    postedDate?: string;
    // FB Marketplace extended fields
    bodyStyle?: string;
    condition?: string;
    drivetrain?: string;
    engine?: string;
    cylinders?: number;
    mpg?: string;
    safetyRating?: string;
    numOwners?: number;
    paidOff?: boolean;
    sellerName?: string;
    // Condition notes (optional, user-entered or vision-extracted)
    conditionExterior?: string;
    conditionInterior?: string;
    conditionMechanical?: string;
    // Seller verification (optional, user-entered)
    sellerResponsiveness?: "not-contacted" | "responsive" | "slow" | "unresponsive";
    sellerTransparency?: "not-assessed" | "transparent" | "evasive" | "dishonest";
    sellerRedFlags?: string;
    sellerQuotes?: string;
}

export interface MarketValues {
    privatePartyLow: number;
    privatePartyAvg: number;
    privatePartyHigh: number;
    dealerRetail: number;
    tradeIn: number;
}

export interface RideshareEligibility {
    eligible: boolean;
    reason: string;
}

export interface RideshareEligibilityResult {
    uberX: RideshareEligibility;
    uberComfort: RideshareEligibility;
    uberXL: RideshareEligibility;
    lyft: RideshareEligibility;
    lyftXL: RideshareEligibility;
}

export interface EarningsScenario {
    weeklyNet: number;
    week13: number;
    week26: number;
    week52: number;
}

export interface RideshareEarnings {
    conservative: EarningsScenario;
    baseline: EarningsScenario;
    optimistic: EarningsScenario;
}

export interface InsuranceEstimates {
    coverageType: "Liability Only" | "Full Coverage"; // New field
    endorsementCost?: number; // New field
    personalMonthly: number;
    personalAnnual: number;
    rideshareMonthly: number;
    rideshareAnnual: number;
    commercialMonthly: number;
    commercialAnnual: number;
    carriers: Record<string, number>;
}

export interface CriticalIssue {
    title: string;
    concern: string;
    benign: string;
    malicious: string;
    action: string;
    severity: "low" | "medium" | "high" | "critical";
}

export type Verdict =
    | "🔥 STRONG BUY"
    | "✅ RECOMMENDED"
    | "⚠️ PROCEED WITH CAUTION"
    | "🚫 AVOID";

export interface StructuredVerdict {
    verdict: Verdict;
    score: number;
    buyIf: string[];
    walkAwayIf: string[];
    redFlags: string[];
    confidence: number;
}

export interface AnalysisResult {
    marketValues: MarketValues;
    criticalIssues: CriticalIssue[];
    rideshare: {
        eligibility: RideshareEligibilityResult;
        earnings: RideshareEarnings;
    };
    insurance: InsuranceEstimates;
    verdict: Verdict;
    instantEquity: number;
    verdictScore: number;
    // Phase 2 sections
    scenarios: import("./scenarios").ScenarioAnalysis;
    breakEven: import("./break-even").BreakEvenAnalysis;
    operationalCosts: import("./operational-costs").OperationalCosts;
    initialInvestment: import("./initial-investment").InitialInvestment;
    paybackWeeks: { conservative: number; baseline: number; optimistic: number };
    actionPlan: import("./action-plan").ActionPlan;
    negotiation: import("./negotiation").NegotiationStrategy;
    structuredVerdict: StructuredVerdict;
    // Phase A: Condition & Seller
    conditionAssessment: ConditionAssessment;
    sellerVerification: SellerVerification;
    // Real-world VIN Data (Antigravity Engine)
    vinAnalysis?: VinAnalysis;
    scoringBreakdown?: ScoringBreakdown;
}

// ── Condition Assessment ──

export interface ConditionChecklistItem {
    item: string;
    expected: "good" | "fair" | "worn" | "replace";
    notes: string;
}

export interface ConditionAssessment {
    exteriorNotes: string;
    interiorNotes: string;
    mechanicalNotes: string;
    expectedChecklist: ConditionChecklistItem[];
}

// ── Seller Verification ──

export interface SellerVerification {
    responsiveness: "not-contacted" | "responsive" | "slow" | "unresponsive";
    transparency: "not-assessed" | "transparent" | "evasive" | "dishonest";
    redFlags: string[];
    sellerQuotes: string;
    contacted: boolean;
}

export interface VinDecodeResult {
    make: string;
    model: string;
    year: string;
    engine: string;
    displacement: string;
    cylinders: string;
    fuelType: string;
    transmission: string;
    driveType: string;
    seats: string;
    bodyClass: string;
}

export interface HistoryEntry {
    id: string;
    timestamp: string;
    vehicle: Vehicle;
    analysis: AnalysisResult;
}

// ── Antigravity Engine Types ──

export interface VinMeta {
    vin: string;
    timestamp: number;
}

export interface VinSpecs {
    year: string;
    make: string;
    model: string;
    trim: string;
}

export interface VinSafety {
    recalls: Array<{
        ReportReceivedDate: string;
        Component: string;
        Summary: string;
        Remedy: string;
    }>;
}

export interface VinHistory {
    maintenance: string[];
}

export interface VinVerdict {
    score: number;
    alerts: string[];
    recommendation: string;
}

export interface VinAnalysis {
    meta: VinMeta;
    specs: VinSpecs;
    safety: VinSafety;
    history: VinHistory;
    verdict: VinVerdict;
}

// ── Scoring Breakdown ──
export interface ScoringFactor {
    label: string;
    points: number;
    description?: string;
    category: "market" | "risk" | "reliability" | "financial";
}

export interface ScoringBreakdown {
    baseScore: number;
    factors: ScoringFactor[];
    totalScore: number;
    verdict: Verdict;
}
