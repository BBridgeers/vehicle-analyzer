import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
    },
    serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'playwright-extra', 'puppeteer-extra-plugin-stealth', 'pdf-parse'],
    // pin the workspace root so the parent dir's lockfile can't confuse tracing
    outputFileTracingRoot: __dirname,
};

export default nextConfig;
