import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Vehicle Analyzer Pro — Stop Getting Played on Used Cars",
    description:
        "Paste a Facebook Marketplace or Craigslist screenshot. Get instant market value, red flags, rideshare projections, insurance estimates, and a negotiation script — in 8 seconds. Free during beta.",
    keywords: [
        "used car analysis",
        "car buying tool",
        "facebook marketplace car",
        "VIN decoder",
        "market value",
        "rideshare earnings",
        "car deal score",
        "lemon detector",
        "negotiation script",
    ],
    openGraph: {
        title: "Vehicle Analyzer Pro — AI-powered used car intelligence",
        description: "Paste a screenshot. Get the truth. Market value, red flags, and a full negotiation script in seconds.",
        type: "website",
        url: "https://vehicle-analyzer.vercel.app",
    },
    twitter: {
        card: "summary_large_image",
        title: "Vehicle Analyzer Pro — Stop getting ripped off on used cars",
        description: "AI vision reads your listing screenshot and gives you market value, red flags, rideshare projections, and a negotiation script. Free beta.",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen antialiased">{children}</body>
        </html>
    );
}
