# 🚗 Vehicle Analyzer Pro

A premium, data-driven vehicle analysis web application built with **Next.js 15**, **TailwindCSS v4**, and **TypeScript**. Deployed to **GitHub Pages**.

> Converted and enhanced from the original Streamlit-based Vehicle Analysis Tool.

## ✨ Features

- **VIN Decoding** — Real-time NHTSA API integration
- **Market Valuation** — Depreciation-based pricing with 6 comparison points
- **Rideshare Analysis** — Platform eligibility + 3-scenario earnings projections
- **Insurance Estimates** — 3 policy types across 6 carriers
- **Critical Issues Detection** — Severity-rated red flag identification with action items
- **Analysis History** — localStorage-backed history with load/delete
- **Report Download** — Export detailed analysis as text report
- **Premium Dark UI** — Glassmorphism, micro-animations, responsive design

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (static export)
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

This project deploys automatically to GitHub Pages via GitHub Actions on push to `main`.

### Manual Setup

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Push to `main` — the workflow will build and deploy automatically

## 🏗️ Project Structure

```
src/
├── app/
│   ├── globals.css       # TailwindCSS v4 + design system
│   ├── layout.tsx        # Root layout with SEO
│   └── page.tsx          # Main page (form + results)
├── components/
│   ├── Header.tsx        # Sticky header
│   ├── VehicleForm.tsx   # Vehicle entry form with VIN decode
│   ├── AnalysisResults.tsx   # Results dashboard
│   ├── IssueCard.tsx     # Expandable issue cards
│   ├── MarketChart.tsx   # Market value comparison chart
│   ├── RidesharePanel.tsx    # Rideshare eligibility + earnings
│   ├── InsurancePanel.tsx    # Insurance estimates
│   ├── HistoryPanel.tsx  # Slide-out history panel
│   └── Toast.tsx         # Notification toasts
└── lib/
    ├── analyze.ts        # Main analysis pipeline
    ├── constants.ts      # Configuration constants
    ├── history.ts        # localStorage history management
    ├── insurance.ts      # Insurance estimation
    ├── issues.ts         # Red flag detection
    ├── market-value.ts   # Market value calculation
    ├── rideshare.ts      # Rideshare eligibility & earnings
    ├── types.ts          # TypeScript interfaces
    └── vin-decoder.ts    # NHTSA VIN decode API
```

## 🔧 Configuration

Edit `src/lib/constants.ts` to customize:

- **Location** — Change `HOME_BASE` for your market
- **Gas price** — Update `GAS_PRICE_DFW`
- **IRS mileage rate** — Update annually
- **Base MSRP values** — Add makes or adjust baseline values

## 📋 Audit Findings (Fixed During Conversion)

| Issue | Fix |
|-------|-----|
| Verdict scoring bug — `risk_score` always counted ALL issues | Now uses severity-weighted scoring |
| Market values could go negative for old/high-mileage vehicles | Added $500 floor |
| No input validation | Added year/mileage clamping and VIN format validation |
| `seats` could be undefined causing crashes | Added null-safe defaults |
| No above-market or high-mileage warnings | Added new issue detectors |
| Single-file monolith (650 lines) | Separated into 9 focused modules |
| No history/persistence | Added localStorage history |

---

**Built with** Next.js 15, TailwindCSS v4, TypeScript, Lucide Icons  
**Optimized for** Dallas-Fort Worth vehicle market  
**Original by** AI Software Sales & Solutions Specialist
