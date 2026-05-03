const fs = require("fs");
const path = "/root/.hermes/cache/documents/doc_82458546aff5_2016 Mazda CX-5 Sport.pdf";

async function testStrategyB() {
    console.log("=== STRATEGY B (pdf-parse v2 - FIXED) ===");
    try {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: fs.readFileSync(path) });
        const result = await parser.getText();
        console.log(`Chars: ${result.text?.length || 0}`);
        console.log(`Has CARFAX: ${/CARFAX/i.test(result.text || "")}`);
        console.log(`Preview: ${(result.text || "").slice(0, 200)}`);
        
        const markers = [/CARFAX/i, /vehicle/i, /mileage/i, /\bVIN\b/i];
        const matches = markers.filter(re => re.test(result.text || ""));
        console.log(`Markers: ${matches.length}/4`);
        console.log(matches.length >= 3 ? "✅ Strategy B PASSED" : "❌ Strategy B FAILED");
    } catch (e) {
        console.log(`❌ Strategy B ERROR: ${e.message}`);
        console.log(e.stack?.slice(0, 400));
    }
}

testStrategyB();
