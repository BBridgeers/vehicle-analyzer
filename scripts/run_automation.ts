/**
 * VEHICLE ANALYZER PRO — AUTOMATED PIPELINE ORCHESTRATOR
 * ═══════════════════════════════════════════════════════
 * STATUS: ⏸ PARKED — Automated scraping is temporarily disabled.
 * The subagent pipeline is preserved for future reactivation.
 * To resume: set AUTOMATION_ENABLED=true in .env.local
 */

const AUTOMATION_ENABLED = process.env.AUTOMATION_ENABLED === 'true';

if (!AUTOMATION_ENABLED) {
    console.log("=========================================");
    console.log("   VEHICLE ANALYZER PRO: CRON ORCHESTRATOR");
    console.log("=========================================\n");
    console.log("⏸  AUTOMATION IS CURRENTLY PARKED.");
    console.log("   Set AUTOMATION_ENABLED=true in .env.local to re-enable.");
    console.log("\n   Individual scripts can still be run manually:");
    console.log("   npx tsx scripts/fb_subagent.ts");
    console.log("   npx tsx scripts/cl_subagent.ts");
    console.log("   npx tsx scripts/at_subagent.ts");
    console.log("   npx tsx scripts/analyzer_csv_export.ts [json_file]");
    process.exit(0);
}

// ─── ACTIVE PIPELINE (when AUTOMATION_ENABLED=true) ───────────────────────
import { execSync } from 'child_process';
import * as fs from 'fs';

console.log("=========================================");
console.log("   VEHICLE ANALYZER PRO: CRON ORCHESTRATOR   ");
console.log("=========================================\n");

try {
    console.log("▶️ Triggering Facebook Subagent...");
    execSync('npx tsx scripts/fb_subagent.ts', { stdio: 'inherit' });
    if (fs.existsSync('golden_vehicles.json')) {
        console.log("\n▶️ Feeding FB Listings into Vehicle Analyzer Pro...");
        execSync('npx tsx scripts/analyzer_csv_export.ts golden_vehicles.json', { stdio: 'inherit' });
    }

    console.log("\n▶️ Triggering Craigslist Subagent...");
    execSync('npx tsx scripts/cl_subagent.ts', { stdio: 'inherit' });
    if (fs.existsSync('cl_golden_vehicles.json')) {
        console.log("\n▶️ Feeding Craigslist Listings into Vehicle Analyzer Pro...");
        execSync('npx tsx scripts/analyzer_csv_export.ts cl_golden_vehicles.json', { stdio: 'inherit' });
    }

    console.log("\n▶️ Triggering AutoTempest Subagent...");
    execSync('npx tsx scripts/at_subagent.ts', { stdio: 'inherit' });
    if (fs.existsSync('at_golden_vehicles.json')) {
        console.log("\n▶️ Feeding AutoTempest Listings into Vehicle Analyzer Pro...");
        execSync('npx tsx scripts/analyzer_csv_export.ts at_golden_vehicles.json', { stdio: 'inherit' });
    }

    console.log("\n✅ ALL MASTER PIPELINES COMPLETE.");
} catch (error: any) {
    console.error("❌ Pipeline Crash:", error.message);
}
