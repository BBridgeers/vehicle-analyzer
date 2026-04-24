// For Node 18+, fetch is global. If using older node, use node-fetch v2.
// const fetch = require('node-fetch'); 


async function testLiveApi() {
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const payload = {
    image: `data:image/png;base64,${dummyBase64}`,
    mimeType: "image/png"
  };

  try {
    const res = await fetch("https://vehicle-analyzer.vercel.app/api/extract-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testLiveApi();
