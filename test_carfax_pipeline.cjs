const fs = require("fs");
const path = "/root/.hermes/cache/documents/doc_82458546aff5_2016 Mazda CX-5 Sport.pdf";

async function main() {
    // ── Strategy A: pdfjs text extraction ──
    console.log("=== STRATEGY A (pdfjs text extraction) ===");
    try {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const buffer = fs.readFileSync(path);
        const uint8 = new Uint8Array(buffer);
        const doc = await pdfjsLib.getDocument({
            data: uint8,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            verbosity: 0,
        }).promise;

        console.log("Pages:", doc.numPages);

        let fullText = "";
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();
            const pageText = content.items.map(i => i.str || "").join(" ");
            fullText += pageText + "\n";
            console.log(`Page ${p}: ${pageText.length} chars → "${pageText.slice(0, 100)}"`);
        }

        console.log("\nTotal chars:", fullText.length);
        console.log("Contains CARFAX:", /CARFAX/i.test(fullText));
        console.log("Contains vehicle:", /vehicle/i.test(fullText));
        console.log("Contains mileage:", /mileage/i.test(fullText));
        console.log("Contains VIN:", /\bVIN\b/i.test(fullText));
        console.log("Contains owner:", /owner/i.test(fullText));

        // Check content validation
        const markers = [
            /CARFAX/i, /vehicle/i, /history/i, /report/i, /owner/i,
            /mileage/i, /odometer/i, /\bVIN\b/i, /title/i, /service/i,
            /accident/i, /damage/i, /salvage/i, /rebuilt/i, /clean/i,
            /\d{4}\s+(Toyota|Honda|Ford|Chevrolet|Nissan|Hyundai|Kia|BMW|Mercedes|Audi|VW|Volkswagen|Subaru|Mazda|Lexus|GMC|Dodge|Jeep|Ram|Tesla|Volvo)/i,
            /WARNING/i, /Alert/i, /Problem Found/i, /No Issues/i,
        ];
        const matches = markers.filter(re => re.test(fullText));
        console.log("Content markers matched:", matches.length, "/", markers.length);

        if (fullText.length >= 100 && matches.length >= 3) {
            console.log("✅ Strategy A PASSED validation");
        } else {
            console.log("❌ Strategy A FAILED validation");
            console.log("  Reason:", fullText.length < 100 ? `too short (${fullText.length} < 100)` : `only ${matches.length}/3 markers`);
        }
    } catch (e) {
        console.log("❌ Strategy A ERROR:", e.message);
    }
}

main().catch(e => console.error("FATAL:", e));
