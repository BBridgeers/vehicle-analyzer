import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
    },
    serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'playwright-extra', 'puppeteer-extra-plugin-stealth'],
};

export default nextConfig;
