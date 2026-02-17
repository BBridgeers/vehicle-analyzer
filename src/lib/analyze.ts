import type { AnalysisResult, Vehicle, Verdict, StructuredVerdict, ConditionAssessment, ConditionChecklistItem, SellerVerification } from "./types";
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
export function analyzeVehicle(vehicle: Vehicle): AnalysisResult {
    // ── 1. Market values ──
    const marketValues = estimateMarketValue(
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.mileage
    );

    // ── 2. Critical issues ──
    const criticalIssues = detectIssues(vehicle, marketValues);

    // ── 3. Rideshare eligibility & earnings ──
    const seats = vehicle.seats ?? 5;
    const eligibility = checkRideshareEligibility(vehicle.year, seats);
    const isXL = eligibility.uberXL.eligible;
    const earnings = calculateRideshareEarnings(isXL);

    // ── 4. Insurance ──
    const insurance = estimateInsurance(vehicle.year, vehicle.make);

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

    const riskScore = criticalIssues.reduce((score, issue) => {
        switch (issue.severity) {
            case "critical": return score + 3;
            case "high": return score + 2;
            case "medium": return score + 1;
            case "low": return score + 0.5;
            default: return score;
        }
    }, 0);

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
        verdict, verdictScore, vehicle, equity, riskScore, criticalIssues
    );

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
    issues: { title: string; severity: string }[]
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
    buyIf.push("Seller provides maintenance records and is transparent about vehicle history.");
    if (vehicle.mileage < 120000) {
        buyIf.push(`Mileage (${vehicle.mileage.toLocaleString()}) is within acceptable range for profitable rideshare.`);
    }

    // Walk-away conditions
    if (equity < 0) {
        walkAwayIf.push(`Already $${Math.abs(equity).toLocaleString()} upside-down before any repairs.`);
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
    let confidence = 60; // base
    if (vehicle.vin) confidence += 15;
    if (vehicle.description) confidence += 5;
    if (vehicle.listingUrl) confidence += 5;
    if (vehicle.source) confidence += 5;
    if (equity > 2000) confidence += 5;
    if (riskScore < 3) confidence += 5;
    confidence = Math.min(100, confidence);

    return { verdict, score, buyIf, walkAwayIf, redFlags, confidence };
}

/**
 * Generate condition assessment with expected checklist based on mileage.
 */
function generateConditionAssessment(vehicle: Vehicle): ConditionAssessment {
    const mi = vehicle.mileage;

    const checklist: ConditionChecklistItem[] = [
        {
            item: "Brake pads & rotors",
            expected: mi < 40000 ? "good" : mi < 80000 ? "fair" : "worn",
            notes: mi >= 80000 ? "Likely need replacement soon" : "",
        },
        {
            item: "Tires (tread depth)",
            expected: mi < 30000 ? "good" : mi < 60000 ? "fair" : "worn",
            notes: mi >= 60000 ? "May need new tires" : "",
        },
        {
            item: "Timing belt / chain",
            expected: mi < 60000 ? "good" : mi < 100000 ? "fair" : "replace",
            notes: mi >= 90000 ? "Timing belt replacement is critical — verify history" : "",
        },
        {
            item: "Suspension components",
            expected: mi < 60000 ? "good" : mi < 100000 ? "fair" : "worn",
            notes: mi >= 100000 ? "Struts, shocks, and bushings likely worn" : "",
        },
        {
            item: "Battery",
            expected: mi < 50000 ? "good" : mi < 80000 ? "fair" : "worn",
            notes: mi >= 80000 ? "Battery may be near end of life" : "",
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
