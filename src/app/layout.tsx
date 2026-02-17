import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Vehicle Analyzer Pro — Smart Vehicle Market Analysis",
    description:
        "Data-driven vehicle analysis tool with VIN decoding, market valuations, rideshare projections, insurance estimates, and professional report generation. Optimized for the DFW market.",
    keywords: [
        "vehicle analysis",
        "car buying tool",
        "VIN decoder",
        "market value",
        "rideshare earnings",
        "used car analysis",
        "DFW",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen antialiased">{children}</body>
        </html>
    );
}
