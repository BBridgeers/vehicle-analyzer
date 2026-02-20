import type { AnalysisResult, Vehicle, Verdict, StructuredVerdict, ConditionAssessment, ConditionChecklistItem, SellerVerification, VinAnalysis, CriticalIssue } from "./types";
import { estimateMarketValue } from "./market-value";
import { checkRideshareEligibility, calculateRideshareEarnings, calculatePaybackWeeks } from "./rideshare";
import { estimateInsurance } from "./insurance";
import { detectIssues } from "./issues";
import { calculateScenarios } from "./scenarios";
import { calculateBreakEven } from "./break-even";
import { calculateOperationalCosts } from "./operational-costs";
import { calculateInitialInvestment } from "./initial-investment";
import { generateActionPlan } from "./action-plan";
import { generateNegotiationStrategy } from "./negotiation";

/**
 * Run the COMPLETE analysis pipeline on a vehicle.
 *
 * Returns all report sections plus supporting data.
 */
export function analyzeVehicle(vehicle: Vehicle, vinData?: VinAnalysis): AnalysisResult {
    // ── 1. Market values ──
    const marketValues = estimateMarketValue(
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.mileage
    );

    // ── 2. Critical issues ──
    let criticalIssues = detectIssues(vehicle, marketValues);

    // ── 2a. Inject VIN-based issues ──
    if (vinData && vinData.safety.recalls.length > 0) {
        criticalIssues.push({
            title: `${vinData.safety.recalls.length} Open Recalls Detected`,
            concern: "NHTSA database reports unrepaired safety recalls.",
            benign: "Recalls are performed free of charge by dealerships.",
            malicious: "Driving with open recalls can be dangerous and may devalue the car.",
            action: "Check specific recall details and verify if they have been performed.",
            severity: "high"
        });
    }

    // ── 3. Rideshare eligibility & earnings ──
    const seats = vehicle.seats ?? 5;
    const eligibility = checkRideshareEligibility(vehicle.year, seats);
    const isXL = eligibility.uberXL.eligible;
    const isComfort = eligibility.uberComfort.eligible;

    let rideClass: "standard" | "comfort" | "xl" = "standard";
    if (isXL) rideClass = "xl";
    else if (isComfort) rideClass = "comfort";

    const earnings = calculateRideshareEarnings(rideClass);

    // ── 4. Insurance ──
    const insurance = estimateInsurance(vehicle.year, vehicle.make, vehicle.price);

    // ── 5. Scenario-based financial analysis ──
    const scenarios = calculateScenarios(vehicle, marketValues);

    // ── 6. Break-even analysis ──
    const breakEven = calculateBreakEven(vehicle, marketValues);

    // ── 7. Operational cost breakdown ──
    const operationalCosts = calculateOperationalCosts(vehicle, insurance, true);

    // ── 8. Initial investment required ──
    const initialInvestment = calculateInitialInvestment(vehicle);

    // ── 9. ROI & Payback timeline ──
    const paybackWeeks = {
        conservative: calculatePaybackWeeks(vehicle.price, earnings.conservative.weeklyNet),
        baseline: calculatePaybackWeeks(vehicle.price, earnings.baseline.weeklyNet),
        optimistic: calculatePaybackWeeks(vehicle.price, earnings.optimistic.weeklyNet),
    };

    // ── 10. Pre-purchase action plan ──
    const actionPlan = generateActionPlan(vehicle, marketValues, criticalIssues);

    // ── 11. Negotiation strategy ──
    const negotiation = generateNegotiationStrategy(vehicle, marketValues, criticalIssues);

    // ── 12. Condition assessment ──
    const conditionAssessment = generateConditionAssessment(vehicle);

    // ── 13. Seller verification ──
    const sellerVerification = generateSellerVerification(vehicle);

    // ── Verdict scoring ──
    const equity = marketValues.privatePartyAvg - vehicle.price;

    let riskScore = criticalIssues.reduce((score, issue) => {
        switch (issue.severity) {
            case "critical": return score + 3;
            case "high": return score + 2;
            case "medium": return score + 1;
            case "low": return score + 0.5;
            default: return score;
        }
    }, 0);

    // If VIN analysis returned a low score, penalize heavily
    if (vinData && vinData.verdict.score < 60) {
        riskScore += 3;
    }

    let verdict: Verdict;
    let verdictScore: number;

    if (equity > 2000 && riskScore < 4) {
        verdict = "🔥 STRONG BUY";
        verdictScore = 90;
    } else if (equity > 1000 && riskScore < 6) {
        verdict = "✅ RECOMMENDED";
        verdictScore = 70;
    } else if (equity > 0) {
        verdict = "⚠️ PROCEED WITH CAUTION";
        verdictScore = 45;
    } else {
        verdict = "🚫 AVOID";
        verdictScore = 20;
    }

    // ── Structured verdict ──
    const structuredVerdict: StructuredVerdict = buildStructuredVerdict(
        verdict, verdictScore, vehicle, equity, riskScore, criticalIssues, vinData
    );

    // ── Scoring Breakdown ──
    const scoringFactors: import("./types").ScoringFactor[] = [];
    let baseScore = 50; // Starting neutral score

    // 1. Financial / Equity
    const equityPoints = Math.min(30, Math.max(-30, Math.round(equity / 100))); // Cap at +/- 30 points
    scoringFactors.push({
        label: "Market Equity",
        points: equityPoints,
        description: `Instant equity estimate: ${equity >= 0 ? '+' : ''}$${equity.toLocaleString()}`,
        category: "financial"
    });

    // 2. Risk Score Penalty
    const riskPenalty = riskScore * -5; // -5 points per risk unit
    if (riskScore > 0) {
        scoringFactors.push({
            label: "Risk Signals",
            points: riskPenalty,
            description: `Accumulated risk score: ${riskScore} (High/Critical issues penalize heavily)`,
            category: "risk"
        });
    }

    // 3. Mileage Logic (Baseline 12k/yr)
    const age = new Date().getFullYear() - vehicle.year;
    const avgMileage = age * 12000;
    const mileageDiff = avgMileage - vehicle.mileage;
    const mileagePoints = Math.min(10, Math.max(-10, Math.round(mileageDiff / 5000)));
    scoringFactors.push({
        label: "Mileage Usage",
        points: mileagePoints,
        description: `${Math.abs(mileageDiff).toLocaleString()} miles ${mileageDiff >= 0 ? 'below' : 'above'} average`,
        category: "reliability"
    });

    // 4. VIN Verification Bonus
    if (vehicle.vin) {
        scoringFactors.push({
            label: "VIN Provided",
            points: 5,
            description: "VIN presence allows for history verification",
            category: "risk"
        });
    } else {
        scoringFactors.push({
            label: "Missing VIN",
            points: -10,
            description: "Cannot verify history without VIN",
            category: "risk"
        });
    }

    // 5. Description Quality
    if (vehicle.description && vehicle.description.length > 50) {
        scoringFactors.push({
            label: "Detailed Listing",
            points: 3,
            description: "Seller provided detailed description",
            category: "reliability"
        });
    }

    // Calculate Total
    const calculatedTotal = Math.min(100, Math.max(0, baseScore + scoringFactors.reduce((sum, f) => sum + f.points, 0)));

    const scoringBreakdown: import("./types").ScoringBreakdown = {
        baseScore,
        factors: scoringFactors,
        totalScore: calculatedTotal,
        verdict
    };

    return {
        marketValues,
        criticalIssues,
        rideshare: { eligibility, earnings },
        insurance,
        verdict,
        instantEquity: equity,
        verdictScore,
        scenarios,
        breakEven,
        operationalCosts,
        initialInvestment,
        paybackWeeks,
        actionPlan,
        negotiation,
        structuredVerdict,
        conditionAssessment,
        sellerVerification,
        vinAnalysis: vinData,
        scoringBreakdown
    };
}

/**
 * Build the structured verdict with Buy If / Walk Away If logic.
 */
function buildStructuredVerdict(
    verdict: Verdict,
    score: number,
    vehicle: Vehicle,
    equity: number,
    riskScore: number,
    issues: CriticalIssue[],
    vinData?: VinAnalysis
): StructuredVerdict {
    const buyIf: string[] = [];
    const walkAwayIf: string[] = [];
    const redFlags: string[] = [];

    // Buy conditions
    if (equity > 0) {
        buyIf.push(`Market equity is +$${equity.toLocaleString()} — room for profit.`);
    }
    buyIf.push("Carfax and AutoCheck both return clean history.");
    buyIf.push("Pre-purchase inspection reveals no major mechanical issues.");

    // VIN-based Buy modifiers
    if (vinData && vinData.history.maintenance.length > 5) {
        buyIf.push(`Solid maintenance history found (${vinData.history.maintenance.length} records).`);
    } else {
        buyIf.push("Seller provides maintenance records and is transparent about vehicle history.");
    }

    if (vehicle.mileage < 120000) {
        buyIf.push(`Mileage (${vehicle.mileage.toLocaleString()}) is within acceptable range for profitable rideshare.`);
    }

    // Walk-away conditions
    if (equity < 0) {
        walkAwayIf.push(`Already $${Math.abs(equity).toLocaleString()} upside-down before any repairs.`);
    }

    if (vinData && vinData.safety.recalls.length > 0) {
        walkAwayIf.push(`${vinData.safety.recalls.length} open recalls require immediate dealership attention.`);
    }

    walkAwayIf.push("Seller refuses PPI or won't provide VIN.");
    walkAwayIf.push("Carfax shows frame damage, flood, or salvage history.");
    walkAwayIf.push("PPI reveals transmission slipping, engine knock, or major fluid leaks.");
    if (riskScore >= 6) {
        walkAwayIf.push(`Risk score is ${riskScore} (high) — too many concerns stacking up.`);
    }

    // Red flags from issues
    for (const issue of issues) {
        if (issue.severity === "critical" || issue.severity === "high") {
            redFlags.push(issue.title);
        }
    }

    // Confidence: higher when we have VIN & more data points
    let confidence = 60; // base (we have basic data)

    // Scraper Quality Boosts
    if (vehicle.vin) confidence += 15;
    if (vehicle.description && vehicle.description.length > 50) confidence += 5;
    if (vehicle.listingUrl) confidence += 5;
    if (vehicle.source) confidence += 5;

    // Real Data Boost
    if (vinData) {
        confidence += 20; // Massive boost for real verification
        // Penalty regarding recalls is handled in riskScore, but confidence is high because we KNOW (even if bad news)
    }

    // Data Quality Boosts (Content Analysis)
    const desc = (vehicle.description || "") + " " + (vehicle.conditionExterior || "") + " " + (vehicle.conditionMechanical || "");
    const analysis = analyzeDescription(desc);

    // Boost confidence if we found meaningful signals
    if (analysis.positive.length > 0) confidence += (analysis.positive.length * 3); // +3 per positive trait found
    if (analysis.negative.length > 0) confidence += 5; // Finding negatives also increases confidence in our assessment!

    // Market/Risk Logic
    if (equity > 2000) confidence += 5;
    if (riskScore < 3) confidence += 5;

    // Cap at 99% (never 100)
    confidence = Math.min(99, confidence);

    return { verdict, score, buyIf, walkAwayIf, redFlags, confidence };
}

/**
 * Detects presence of key maintenance or condition phrases.
 */
function analyzeDescription(description: string): { positive: string[]; negative: string[]; components: Record<string, string> } {
    const text = description.toLowerCase();
    const positive: string[] = [];
    const negative: string[] = [];
    const components: Record<string, string> = {};

    // Positive Keywords
    if (text.includes("new tires") || text.includes("brand new tires") || text.includes("good tires") || text.includes("recent tires")) {
        positive.push("New/Good Tires mentioned");
        components["tires"] = "good";
    }
    if (text.includes("new battery")) {
        positive.push("New Battery mentioned");
        components["battery"] = "good";
    }
    if (text.includes("new brakes") || text.includes("brakes replaced") || text.includes("recent brakes")) {
        positive.push("New Brakes mentioned");
        components["brakes"] = "good";
    }
    if (text.includes("timing belt replaced") || text.includes("new timing belt")) {
        positive.push("Timing Belt Service mentioned");
        components["timing_belt"] = "good";
    }
    if (text.includes("maintenance records") || text.includes("service records") || text.includes("all records")) {
        positive.push("Maintenance Records Available");
    }
    if (text.includes("garage kept") || text.includes("garage stored")) {
        positive.push("Garage Kept");
    }
    if (text.includes("clean title")) {
        positive.push("Clean Title Confirmed");
    }
    if (text.includes("one owner") || text.includes("1 owner") || text.includes("single owner")) {
        positive.push("One Owner Vehicle");
    }
    if (text.includes("cold ac") || text.includes("ice cold") || text.includes("ac blows cold") || text.includes("air conditioning")) {
        positive.push("AC Functioning");
        components["ac"] = "good";
    }
    if (text.includes("passed inspection") || text.includes("state inspection") || text.includes("inspected")) {
        positive.push("Recently Inspected");
    }
    if (text.includes("clean inside and out") || text.includes("clean interior") || text.includes("interior clean")) {
        positive.push("Clean Condition (In/Out)");
        components["interior"] = "good";
        components["exterior"] = "good";
    }
    if (text.includes("ready to drive") || text.includes("turn key") || text.includes("daily driver")) {
        positive.push("Ready to Drive / Daily Driver");
    }
    if (text.includes("cash only")) {
        positive.push("Cash Buyer Preferred (Leverage)");
    }

    // Negative Keywords (simple detection)
    if (text.includes("needs tires") || text.includes("tires worn") || text.includes("bald tires")) {
        negative.push("Needs Tires");
        components["tires"] = "replace";
    }
    if (text.includes("needs brakes") || text.includes("brakes worn")) {
        negative.push("Needs Brakes");
        components["brakes"] = "replace";
    }
    if (text.includes("check engine light") && !text.includes("no check engine light")) {
        negative.push("Check Engine Light (Possible issue)");
    }
    if (text.includes("leak") || text.includes("leaking")) {
        negative.push("Potential Leak mentioned");
    }
    if (text.includes("salvage") || text.includes("rebuilt")) {
        negative.push("Salvage/Rebuilt Title mentioned");
    }

    return { positive, negative, components };
}

/**
 * Generate condition assessment with expected checklist based on mileage.
 */
function generateConditionAssessment(vehicle: Vehicle): ConditionAssessment {
    const mi = vehicle.mileage;
    const desc = (vehicle.description || "") + " " + (vehicle.conditionExterior || "") + " " + (vehicle.conditionMechanical || "");
    const analysis = analyzeDescription(desc);

    // Default mileage-based logic, potentially overridden by description analysis
    const checklist: ConditionChecklistItem[] = [
        {
            item: "Brake pads & rotors",
            expected: (analysis.components["brakes"] as any) || (mi < 40000 ? "good" : mi < 80000 ? "fair" : "worn"),
            notes: analysis.components["brakes"] === "good" ? "Seller mentions recent replacement" : (mi >= 80000 ? "Likely need replacement soon" : ""),
        },
        {
            item: "Tires (tread depth)",
            expected: (analysis.components["tires"] as any) || (mi < 30000 ? "good" : mi < 60000 ? "fair" : "worn"),
            notes: analysis.components["tires"] === "good" ? "Seller mentions good/new tires" : (mi >= 60000 ? "May need new tires" : ""),
        },
        {
            item: "Timing belt / chain",
            expected: (analysis.components["timing_belt"] as any) || (mi < 60000 ? "good" : mi < 100000 ? "fair" : "replace"),
            notes: analysis.components["timing_belt"] === "good" ? "Seller mentions timing belt service" : (mi >= 90000 ? "Timing belt replacement is critical — verify history" : ""),
        },
        {
            item: "Suspension components",
            expected: mi < 60000 ? "good" : mi < 100000 ? "fair" : "worn",
            notes: mi >= 100000 ? "Struts, shocks, and bushings likely worn" : "",
        },
        {
            item: "Battery",
            expected: (analysis.components["battery"] as any) || (mi < 50000 ? "good" : mi < 80000 ? "fair" : "worn"),
            notes: analysis.components["battery"] === "good" ? "Seller mentions new battery" : (mi >= 80000 ? "Battery may be near end of life" : ""),
        },
        {
            item: "Transmission fluid",
            expected: mi < 60000 ? "good" : mi < 100000 ? "fair" : "worn",
            notes: mi >= 100000 ? "Should have been changed at least once" : "",
        },
        {
            item: "Engine oil / seals",
            expected: mi < 80000 ? "good" : mi < 120000 ? "fair" : "worn",
            notes: mi >= 120000 ? "Watch for oil leaks around valve cover gaskets" : "",
        },
        {
            item: "AC / HVAC system",
            expected: mi < 70000 ? "good" : mi < 120000 ? "fair" : "worn",
            notes: mi >= 120000 ? "Compressor or evaporator may need attention" : "",
        },
        {
            item: "Exhaust system",
            expected: mi < 80000 ? "good" : mi < 130000 ? "fair" : "worn",
            notes: mi >= 130000 ? "Check for rust, leaks, catalytic converter condition" : "",
        },
        {
            item: "Paint / clear coat",
            expected: mi < 50000 ? "good" : mi < 100000 ? "fair" : "worn",
            notes: "",
        },
    ];

    return {
        exteriorNotes: vehicle.conditionExterior || "",
        interiorNotes: vehicle.conditionInterior || "",
        mechanicalNotes: vehicle.conditionMechanical || "",
        expectedChecklist: checklist,
    };
}

/**
 * Generate seller verification from vehicle form data.
 */
function generateSellerVerification(vehicle: Vehicle): SellerVerification {
    const responsiveness = vehicle.sellerResponsiveness || "not-contacted";
    const transparency = vehicle.sellerTransparency || "not-assessed";
    const redFlagsRaw = vehicle.sellerRedFlags || "";
    const sellerQuotes = vehicle.sellerQuotes || "";
    const contacted = responsiveness !== "not-contacted" || transparency !== "not-assessed";

    // Parse red flags from comma/newline separated string
    const redFlags = redFlagsRaw
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    return { responsiveness, transparency, redFlags, sellerQuotes, contacted };
}
