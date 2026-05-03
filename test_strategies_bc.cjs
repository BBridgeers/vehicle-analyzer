const fs = require("fs");
const path = "/root/.hermes/cache/documents/doc_82458546aff5_2016 Mazda CX-5 Sport.pdf";

async function testStrategyB() {
    console.log("=== STRATEGY B (pdf-parse) ===");
    try {
        const pdfParse = await import("pdf-parse");
        const parseFn = pdfParse.default || pdfParse;
        const buffer = fs.readFileSync(path);
        const data = await parseFn(buffer);
        console.log(`Chars: ${data.text?.length || 0}`);
        console.log(`Pages: ${data.numpages}`);
        console.log(`Has CARFAX: ${/CARFAX/i.test(data.text || "")}`);
        if (data.text) {
            console.log(`Preview: ${data.text.slice(0, 200)}`);
        }
        const markers = [/CARFAX/i, /vehicle/i, /mileage/i, /\bVIN\b/i];
        const matches = markers.filter(re => re.test(data.text || ""));
        console.log(`Markers: ${matches.length}/4`);
        console.log(matches.length >= 3 ? "✅ Strategy B PASSED" : "❌ Strategy B FAILED");
    } catch (e) {
        console.log(`❌ Strategy B ERROR: ${e.message}`);
        console.log(e.stack?.slice(0, 300));
    }
}

async function testStrategyC() {
    console.log("\n=== STRATEGY C (canvas + vision OCR) ===");
    try {
        const { createCanvas } = await import("@napi-rs/canvas");
        console.log("Canvas loaded OK");
        
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

        const scale = 1.5;
        const totalPages = Math.min(doc.numPages, 4); // Test first 4 pages
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await doc.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = createCanvas(viewport.width, viewport.height);
            const ctx = canvas.getContext("2d");
            
            await page.render({
                canvasContext: ctx,
                viewport,
            }).promise;
            
            const jpeg = await canvas.encode("jpeg", 75);
            console.log(`Page ${pageNum}: rendered ${viewport.width}x${viewport.height} → ${jpeg.length} bytes JPEG`);
        }
        console.log("✅ Strategy C rendering works");
    } catch (e) {
        console.log(`❌ Strategy C ERROR: ${e.message}`);
        console.log(e.stack?.slice(0, 500));
    }
}

(async () => {
    await testStrategyB();
    await testStrategyC();
})();
