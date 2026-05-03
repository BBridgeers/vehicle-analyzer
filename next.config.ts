import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
    },
    serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'playwright-extra', 'puppeteer-extra-plugin-stealth', '@napi-rs/canvas', 'pdf-parse'],
    // 60s timeout for CARFAX analysis (Vercel Pro)
    maxDuration: 55,
};

export default nextConfig;
