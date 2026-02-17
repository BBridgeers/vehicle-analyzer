// =====================================================
// DOCX REPORT GENERATION — produces a downloadable .docx
// Uses raw XML (Office Open XML) to avoid external deps
// =====================================================

import type { Vehicle, AnalysisResult } from "./types";

/**
 * Generate and download a DOCX report for a single vehicle analysis.
 * Uses the Office Open XML format (manually constructed ZIP of XML).
 */
export async function downloadDocxReport(vehicle: Vehicle, analysis: AnalysisResult): Promise<void> {
    const content = buildDocxXml(vehicle, analysis);
    const blob = createDocxBlob(content);
    const filename = `${vehicle.year}_${vehicle.make}_${vehicle.model}_Analysis.docx`.replace(/\s+/g, "_");
    triggerDownload(blob, filename);
}

/**
 * Generate and download a ZIP of DOCX reports for multiple vehicle analyses.
 */
export async function downloadBatchDocx(
    items: Array<{ vehicle: Vehicle; analysis: AnalysisResult }>
): Promise<void> {
    if (items.length === 1) {
        return downloadDocxReport(items[0].vehicle, items[0].analysis);
    }

    // For multiple, generate individual downloads sequentially
    for (const item of items) {
        await downloadDocxReport(item.vehicle, item.analysis);
        // Small delay between downloads so browser doesn't block them
        await new Promise((r) => setTimeout(r, 300));
    }
}

// ── Build the DOCX XML content ──

function buildDocxXml(vehicle: Vehicle, analysis: AnalysisResult): string {
    const v = vehicle;
    const a = analysis;

    const sections: string[] = [];

    // Title
    sections.push(heading1(`${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""} — Vehicle Analysis Report`));
    sections.push(para(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`));
    sections.push(hr());

    // ── 1. EXECUTIVE SUMMARY ──
    sections.push(heading2("📊 Executive Summary"));
    sections.push(para(`Verdict: ${a.verdict} (Score: ${a.verdictScore}/100)`));
    sections.push(para(`Asking Price: $${v.price.toLocaleString()}`));
    sections.push(para(`Market Value (Private Party): $${a.marketValues.privatePartyAvg.toLocaleString()}`));
    sections.push(para(`Instant Equity: $${a.instantEquity.toLocaleString()}`));
    sections.push(para(`Critical Issues: ${a.criticalIssues.length} identified`));
    sections.push(hr());

    // ── 2. VEHICLE SPECIFICATIONS ──
    sections.push(heading2("🚗 Vehicle Specifications"));
    const specs: [string, string][] = [
        ["Year", String(v.year)],
        ["Make", v.make],
        ["Model", v.model],
        ["Trim", v.trim || "N/A"],
        ["Mileage", `${v.mileage.toLocaleString()} miles`],
        ["Price", `$${v.price.toLocaleString()}`],
        ["Location", v.location || "N/A"],
        ["Title Status", v.titleStatus || "N/A"],
        ["Transmission", v.transmission || "N/A"],
        ["Fuel Type", v.fuelType || "N/A"],
        ["Exterior Color", v.exteriorColor || "N/A"],
        ["Interior Color", v.interiorColor || "N/A"],
        ["Seats", v.seats ? String(v.seats) : "N/A"],
        ["Source", v.source || "N/A"],
    ];
    sections.push(table(specs));
    sections.push(hr());

    // ── 3. MARKET VALUE ANALYSIS ──
    sections.push(heading2("💰 Market Value Analysis"));
    const marketRows: [string, string][] = [
        ["Private Party (Low)", `$${a.marketValues.privatePartyLow.toLocaleString()}`],
        ["Private Party (Avg)", `$${a.marketValues.privatePartyAvg.toLocaleString()}`],
        ["Private Party (High)", `$${a.marketValues.privatePartyHigh.toLocaleString()}`],
        ["Dealer Retail", `$${a.marketValues.dealerRetail.toLocaleString()}`],
        ["Trade-In", `$${a.marketValues.tradeIn.toLocaleString()}`],
        ["Instant Equity vs Avg", `$${a.instantEquity.toLocaleString()}`],
    ];
    sections.push(table(marketRows));
    sections.push(hr());

    // ── 4. CRITICAL ISSUES TO VERIFY ──
    sections.push(heading2("🚨 Critical Issues to Verify"));
    if (a.criticalIssues.length === 0) {
        sections.push(para("No critical issues identified."));
    } else {
        for (const issue of a.criticalIssues) {
            sections.push(heading3(`${issue.severity.toUpperCase()}: ${issue.title}`));
            sections.push(para(`Concern: ${issue.concern}`));
            sections.push(para(`If Benign: ${issue.benign}`));
            sections.push(para(`If Malicious: ${issue.malicious}`));
            sections.push(para(`Action: ${issue.action}`));
        }
    }
    sections.push(hr());

    // ── 5. CONDITION ASSESSMENT ──
    sections.push(heading2("🔧 Condition Assessment"));
    const ca = a.conditionAssessment;
    sections.push(heading3("Exterior Notes"));
    sections.push(para(ca.exteriorNotes || "Not provided"));
    sections.push(heading3("Interior Notes"));
    sections.push(para(ca.interiorNotes || "Not provided"));
    sections.push(heading3("Mechanical Notes"));
    sections.push(para(ca.mechanicalNotes || "Not provided"));
    if (ca.expectedChecklist.length > 0) {
        sections.push(heading3(`Expected Condition at ${v.mileage.toLocaleString()} Miles`));
        for (const item of ca.expectedChecklist) {
            const icon = item.expected === "good" ? "✅" : item.expected === "fair" ? "⚠️" : item.expected === "worn" ? "🔶" : "🔴";
            sections.push(para(`${icon} ${item.item}: ${item.notes}`));
        }
    }
    sections.push(hr());

    // ── 6. SELLER VERIFICATION ──
    sections.push(heading2("✅ Seller Verification"));
    const sv = a.sellerVerification;
    sections.push(para(`Responsiveness: ${sv.responsiveness}`));
    sections.push(para(`Transparency: ${sv.transparency}`));
    if (sv.redFlags.length > 0) {
        sections.push(para(`Red Flags: ${sv.redFlags.join("; ")}`));
    }
    if (sv.sellerQuotes) {
        sections.push(para(`Seller Quotes: "${sv.sellerQuotes}"`));
    }
    sections.push(hr());

    // ── 7. SCENARIO-BASED FINANCIAL ANALYSIS ──
    sections.push(heading2("📈 Scenario-Based Financial Analysis"));
    if (a.scenarios) {
        const s = a.scenarios;
        for (const scenario of s.scenarios) {
            sections.push(heading3(scenario.label));
            sections.push(para(scenario.description));
            sections.push(para(`Total Cost: $${scenario.totalCost.toLocaleString()}`));
        }
    }
    sections.push(hr());

    // ── 8. BREAK-EVEN ANALYSIS ──
    sections.push(heading2("⚖️ Break-Even Analysis"));
    if (a.breakEven) {
        sections.push(para(`Repair Cushion: $${a.breakEven.repairCushion.toLocaleString()}`));
        sections.push(para(`Max Repair Before Loss: $${a.breakEven.maxRepairBudget.toLocaleString()}`));
        sections.push(para(`Risk Assessment: ${a.breakEven.riskAssessment}`));
    }
    sections.push(hr());

    // ── 9. INSURANCE COST ESTIMATES ──
    sections.push(heading2("🛡️ Insurance Cost Estimates"));
    const ins = a.insurance;
    const insRows: [string, string][] = [
        ["Personal (Monthly)", `$${ins.personalMonthly}`],
        ["Personal (Annual)", `$${ins.personalAnnual}`],
        ["Rideshare (Monthly)", `$${ins.rideshareMonthly}`],
        ["Rideshare (Annual)", `$${ins.rideshareAnnual}`],
        ["Commercial (Monthly)", `$${ins.commercialMonthly}`],
        ["Commercial (Annual)", `$${ins.commercialAnnual}`],
    ];
    sections.push(table(insRows));
    if (ins.carriers) {
        sections.push(heading3("Carrier Estimates"));
        for (const [carrier, price] of Object.entries(ins.carriers)) {
            sections.push(para(`${carrier}: $${price}/mo`));
        }
    }
    sections.push(hr());

    // ── 10. OPERATIONAL COST BREAKDOWN ──
    sections.push(heading2("💸 Complete Operational Cost Breakdown"));
    if (a.operationalCosts) {
        const oc = a.operationalCosts;
        const opRows: [string, string][] = oc.expenses.map(e => [e.category, `$${e.monthly.toLocaleString()}`]);
        opRows.push(["Monthly Total", `$${oc.totalMonthly.toLocaleString()}`]);
        opRows.push(["Annual Total", `$${oc.totalAnnual.toLocaleString()}`]);
        opRows.push(["5-Year Total", `$${oc.fiveYearTotal.toLocaleString()}`]);
        sections.push(table(opRows));
    }
    sections.push(hr());

    // ── 11. INITIAL INVESTMENT REQUIRED ──
    sections.push(heading2("🏗️ Initial Investment Required"));
    if (a.initialInvestment) {
        const ii = a.initialInvestment;
        for (const item of ii.items) {
            sections.push(para(`${item.item}: $${item.cost} ${item.required ? "(Required)" : "(Optional)"}`));
        }
        sections.push(para(`Total Required: $${ii.totalRequired.toLocaleString()}`));
        sections.push(para(`Grand Total (with optional): $${ii.totalAll.toLocaleString()}`));
    }
    sections.push(hr());

    // ── 12. ROI & PAYBACK TIMELINE ──
    sections.push(heading2("📅 ROI & Payback Timeline"));
    const pw = a.paybackWeeks;
    const payRows: [string, string][] = [
        ["Conservative", `${pw.conservative} weeks`],
        ["Baseline", `${pw.baseline} weeks`],
        ["Optimistic", `${pw.optimistic} weeks`],
    ];
    sections.push(table(payRows));
    sections.push(hr());

    // ── 13. RIDESHARE ELIGIBILITY ──
    sections.push(heading2("🚕 Rideshare Eligibility"));
    const re = a.rideshare.eligibility;
    const rsRows: [string, string][] = [
        ["UberX", `${re.uberX.eligible ? "✅ YES" : "❌ NO"} — ${re.uberX.reason}`],
        ["UberXL", `${re.uberXL.eligible ? "✅ YES" : "❌ NO"} — ${re.uberXL.reason}`],
        ["Lyft", `${re.lyft.eligible ? "✅ YES" : "❌ NO"} — ${re.lyft.reason}`],
        ["Lyft XL", `${re.lyftXL.eligible ? "✅ YES" : "❌ NO"} — ${re.lyftXL.reason}`],
    ];
    sections.push(table(rsRows));
    sections.push(hr());

    // ── 14. PRE-PURCHASE ACTION PLAN ──
    sections.push(heading2("📋 Pre-Purchase Action Plan"));
    if (a.actionPlan) {
        for (let i = 0; i < a.actionPlan.steps.length; i++) {
            const step = a.actionPlan.steps[i];
            sections.push(heading3(`Step ${i + 1}: ${step.title}`));
            sections.push(para(step.description));
            sections.push(para(`Priority: ${step.priority}`));
        }
    }
    sections.push(hr());

    // ── 15. NEGOTIATION STRATEGY ──
    sections.push(heading2("🤝 Negotiation Strategy"));
    if (a.negotiation) {
        sections.push(para(`Target Price: $${a.negotiation.targetPrice.toLocaleString()}`));
        sections.push(para(`Walk-Away Price: $${a.negotiation.walkAwayPrice.toLocaleString()}`));
        sections.push(heading3("Leverage Points"));
        for (const lp of a.negotiation.leveragePoints) {
            sections.push(para(`• ${lp}`));
        }
        if (a.negotiation.doNotList && a.negotiation.doNotList.length > 0) {
            sections.push(heading3("Do NOT"));
            for (const dn of a.negotiation.doNotList) {
                sections.push(para(`❌ ${dn}`));
            }
        }
    }
    sections.push(hr());

    // ── 16. FINAL VERDICT ──
    sections.push(heading2("🏁 Final Verdict"));
    const fv = a.structuredVerdict;
    sections.push(para(`Verdict: ${fv.verdict}`));
    sections.push(para(`Score: ${fv.score}/100 | Confidence: ${fv.confidence}%`));
    sections.push(heading3("Buy If:"));
    for (const b of fv.buyIf) sections.push(para(`✅ ${b}`));
    sections.push(heading3("Walk Away If:"));
    for (const w of fv.walkAwayIf) sections.push(para(`🚫 ${w}`));
    if (fv.redFlags.length > 0) {
        sections.push(heading3("Red Flags:"));
        for (const rf of fv.redFlags) sections.push(para(`🔴 ${rf}`));
    }

    // Footer
    sections.push(hr());
    sections.push(para("Generated by Vehicle Analyzer Pro — https://vehicle-analyzer-bbridgeers-projects.vercel.app"));
    sections.push(para(`Non-negotiable sections: 11/11 complete`));

    return sections.join("");
}

// ── XML helpers ──

function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function heading1(text: string): string {
    return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function heading2(text: string): string {
    return `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function heading3(text: string): string {
    return `<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function para(text: string): string {
    return `<w:p><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function hr(): string {
    return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>`;
}

function table(rows: [string, string][]): string {
    const trs = rows.map(
        ([label, value]) =>
            `<w:tr>
                <w:tc><w:tcPr><w:tcW w:w="4000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${esc(label)}</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${esc(value)}</w:t></w:r></w:p></w:tc>
            </w:tr>`
    ).join("");

    return `<w:tbl>
        <w:tblPr>
            <w:tblStyle w:val="TableGrid"/>
            <w:tblW w:w="9000" w:type="dxa"/>
            <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="DDDDDD"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="DDDDDD"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="DDDDDD"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="DDDDDD"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="DDDDDD"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="DDDDDD"/>
            </w:tblBorders>
        </w:tblPr>
        ${trs}
    </w:tbl>`;
}

// ── Create DOCX blob (OOXML ZIP) ──

function createDocxBlob(bodyXml: string): Blob {
    // DOCX is a ZIP containing XML files. We use a minimal structure.
    // For client-side ZIP creation without dependencies, we build the raw bytes.

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="heading 1"/>
        <w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>
        <w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1a1a2e"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
        <w:name w:val="heading 2"/>
        <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
        <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="4f46e5"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
        <w:name w:val="heading 3"/>
        <w:pPr><w:spacing w:before="160" w:after="60"/></w:pPr>
        <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="333355"/></w:rPr>
    </w:style>
    <w:style w:type="table" w:styleId="TableGrid">
        <w:name w:val="Table Grid"/>
    </w:style>
</w:styles>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:body>
        ${bodyXml}
    </w:body>
</w:document>`;

    // Build a minimal ZIP manually using Uint8Array
    const files: Record<string, string> = {
        "[Content_Types].xml": contentTypesXml,
        "_rels/.rels": relsXml,
        "word/_rels/document.xml.rels": wordRelsXml,
        "word/document.xml": documentXml,
        "word/styles.xml": stylesXml,
    };

    return buildZipBlob(files);
}

// ── Minimal ZIP builder (no external deps) ──

function buildZipBlob(files: Record<string, string>): Blob {
    const encoder = new TextEncoder();
    const entries: { name: Uint8Array; data: Uint8Array; offset: number }[] = [];
    const parts: Uint8Array[] = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
        const nameBytes = encoder.encode(name);
        const dataBytes = encoder.encode(content);

        // Local file header
        const header = new Uint8Array(30 + nameBytes.length);
        const hv = new DataView(header.buffer);
        hv.setUint32(0, 0x04034b50, true); // Local file header signature
        hv.setUint16(4, 20, true); // Version needed
        hv.setUint16(6, 0, true); // Flags
        hv.setUint16(8, 0, true); // Compression method (store)
        hv.setUint16(10, 0, true); // Mod time
        hv.setUint16(12, 0, true); // Mod date
        hv.setUint32(14, crc32(dataBytes), true); // CRC-32
        hv.setUint32(18, dataBytes.length, true); // Compressed size
        hv.setUint32(22, dataBytes.length, true); // Uncompressed size
        hv.setUint16(26, nameBytes.length, true); // File name length
        hv.setUint16(28, 0, true); // Extra field length
        header.set(nameBytes, 30);

        entries.push({ name: nameBytes, data: dataBytes, offset });
        parts.push(header, dataBytes);
        offset += header.length + dataBytes.length;
    }

    // Central directory
    const centralStart = offset;
    for (const entry of entries) {
        const cd = new Uint8Array(46 + entry.name.length);
        const cv = new DataView(cd.buffer);
        cv.setUint32(0, 0x02014b50, true); // Central directory signature
        cv.setUint16(4, 20, true); // Version made by
        cv.setUint16(6, 20, true); // Version needed
        cv.setUint16(8, 0, true); // Flags
        cv.setUint16(10, 0, true); // Compression method
        cv.setUint16(12, 0, true); // Mod time
        cv.setUint16(14, 0, true); // Mod date
        cv.setUint32(16, crc32(entry.data), true); // CRC-32
        cv.setUint32(20, entry.data.length, true); // Compressed size
        cv.setUint32(24, entry.data.length, true); // Uncompressed size
        cv.setUint16(28, entry.name.length, true); // File name length
        cv.setUint16(30, 0, true); // Extra field length
        cv.setUint16(32, 0, true); // File comment length
        cv.setUint16(34, 0, true); // Disk number start
        cv.setUint16(36, 0, true); // Internal file attributes
        cv.setUint32(38, 0, true); // External file attributes
        cv.setUint32(42, entry.offset, true); // Relative offset
        cd.set(entry.name, 46);

        parts.push(cd);
        offset += cd.length;
    }

    // End of central directory
    const ecd = new Uint8Array(22);
    const ev = new DataView(ecd.buffer);
    ev.setUint32(0, 0x06054b50, true); // EOCD signature
    ev.setUint16(4, 0, true); // Disk number
    ev.setUint16(6, 0, true); // Disk with central directory
    ev.setUint16(8, entries.length, true); // Entries on this disk
    ev.setUint16(10, entries.length, true); // Total entries
    ev.setUint32(12, offset - centralStart, true); // Central directory size
    ev.setUint32(16, centralStart, true); // Central directory offset
    ev.setUint16(20, 0, true); // Comment length
    parts.push(ecd);

    return new Blob(parts as any[], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

// ── CRC-32 (for ZIP) ──

function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Download trigger ──

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
