# Vehicle Analyzer Pro — Full Implementation Plan

> **Created:** 2026-02-14
> **Status:** IN PROGRESS
> **Goal:** Close every gap between current app and requirements doc (100% feature parity)

---

## Current State: ~30% complete

- ✅ Core analysis engine (market, rideshare, insurance, issues, VIN decode)
- ✅ Basic UI (form with 9/15 fields, collapsible results, history)
- ❌ 6 input fields missing from form
- ❌ 8.5 of 11 non-negotiable report sections missing
- ❌ No image upload, no DOCX, no bulk import, no comparison, no toggle

---

## Phase 1: Complete the Input Form (Priority: IMMEDIATE)

**Goal:** All 15 specified data fields present in the form UI

### Task 1.1 — Add missing form fields to VehicleForm.tsx

- [ ] Posted Date (date picker or dropdown: Today / <3 days / <7 days / older)
- [ ] Exterior Color (text input)
- [ ] Interior Color (text input)
- [ ] Transmission (dropdown: Automatic / Manual / CVT)
- [ ] Fuel Type (dropdown: Gasoline / Diesel / Hybrid / Electric / Plug-in Hybrid)
- [ ] Source (dropdown: Facebook Marketplace / Craigslist / Cars.com / CarGurus / Autotrader / OfferUp / Other)
- [ ] Listing URL (text input, url type)
- [ ] Listing Description (textarea, multi-line)

### Task 1.2 — Add Posted Date to Vehicle type

- [ ] Add `postedDate?: string` to `Vehicle` interface in `types.ts`

### Task 1.3 — Update form default state

- [ ] Set sensible defaults for new fields
- [ ] Ensure VIN decode auto-fills transmission and fuelType when available

**Files:** `types.ts`, `VehicleForm.tsx`, `vin-decoder.ts`
**Acceptance:** All 15 fields visible & functional. VIN decode fills applicable ones.

---

## Phase 2: Missing Report Sections — Analysis Engine (Priority: HIGH)

**Goal:** Add all 11 non-negotiable report sections with full data generation

### Task 2.1 — Scenario-Based Financial Analysis (4 scenarios)

- [ ] Create `src/lib/scenarios.ts`
- [ ] Best Case: clean history + no repairs needed
- [ ] Typical Case: minor maintenance ($500-1000)
- [ ] Worst Case: major repair needed ($2000-3000)
- [ ] Disaster Case: engine/transmission failure ($4000-6000)
- [ ] Each scenario: total cost, effective price, equity impact

### Task 2.2 — Break-Even Analysis

- [ ] Create `src/lib/break-even.ts`
- [ ] Repair cushion = market value − asking price
- [ ] Max repair budget before upside-down
- [ ] Break-even mileage for rideshare ROI

### Task 2.3 — Complete Operational Cost Breakdown

- [ ] Create `src/lib/operational-costs.ts`
- [ ] 8+ expense categories: fuel, insurance, maintenance, registration, inspection, tires, depreciation, rideshare fees
- [ ] Monthly and annual projections
- [ ] Cost per mile calculation

### Task 2.4 — Initial Investment Required (Rideshare Setup)

- [ ] Add to `src/lib/rideshare.ts` or create `src/lib/initial-investment.ts`
- [ ] Itemized: vehicle price, TNC permit, vehicle inspection, phone mount, dashcam, detailing, emergency kit, registration/tax
- [ ] Total startup cost

### Task 2.5 — ROI & Payback Timeline

- [ ] Extend `src/lib/rideshare.ts`
- [ ] `calculatePaybackWeeks()` already exists but NOT rendered
- [ ] Add weekly payback curve data (weeks 1-52)
- [ ] 3 scenarios: conservative, baseline, optimistic

### Task 2.6 — Pre-Purchase Action Plan

- [ ] Create `src/lib/action-plan.ts`
- [ ] 5-step checklist: (1) Run Carfax + AutoCheck, (2) Call seller, (3) Schedule PPI, (4) Physical inspection, (5) Negotiate
- [ ] Generate dynamic links (Carfax URL with VIN, KBB lookup URL, etc.)

### Task 2.7 — Negotiation Strategy

- [ ] Create `src/lib/negotiation.ts`
- [ ] Target price (based on market data)
- [ ] Opening offer (15-20% below asking)
- [ ] Walk-away price
- [ ] Leverage points (from detected issues)
- [ ] Do-Not list (common negotiation traps)

### Task 2.8 — Final Verdict (structured)

- [ ] Extend verdict in `src/lib/analyze.ts`
- [ ] "Buy If" conditions (list of green flags)
- [ ] "Walk Away If" conditions (list of deal-breakers)
- [ ] "Red Flags Detected" (from issues list)
- [ ] Confidence score (0-100)

### Task 2.9 — Condition Assessment (hybrid)

- [ ] Add condition fields to `types.ts` and `VehicleForm.tsx`
- [ ] Manual text entry for: exterior notes, interior notes, mechanical notes
- [ ] Auto-generated "Expected Condition at X Miles" checklist
- [ ] Placeholder for future GPT-4V photo analysis

### Task 2.10 — Seller Verification (manual entry)

- [ ] Add seller fields to `types.ts`
- [ ] Form section: responsiveness, transparency, red flags, quotes
- [ ] Optional — user fills in after contacting seller

### Task 2.11 — Update AnalysisResult type

- [ ] Add new section data to `AnalysisResult` interface
- [ ] Update `analyzeVehicle()` to call all new modules

**Files:** New files in `src/lib/`, updated `types.ts`, `analyze.ts`
**Acceptance:** `analyzeVehicle()` returns complete data for all 11 sections.

---

## Phase 3: Report Section UI Components (Priority: HIGH)

**Goal:** Render all new analysis sections in the results panel

### Task 3.1 — ScenarioAnalysisPanel.tsx

- [ ] 4-column table: Best / Typical / Worst / Disaster
- [ ] Per-scenario: repairs, total cost, effective price, equity

### Task 3.2 — BreakEvenPanel.tsx

- [ ] Repair cushion visual (progress bar)
- [ ] Max repair budget callout
- [ ] Break-even data points

### Task 3.3 — OperationalCostsPanel.tsx

- [ ] Monthly/Annual toggle
- [ ] 8+ expense category breakdown
- [ ] Cost per mile highlight
- [ ] Total monthly/annual cost

### Task 3.4 — InitialInvestmentPanel.tsx

- [ ] Itemized table with costs
- [ ] Total startup cost callout

### Task 3.5 — PaybackPanel.tsx

- [ ] 3-scenario payback timeline
- [ ] Weeks to payback for each
- [ ] Visual timeline or bar chart

### Task 3.6 — ActionPlanPanel.tsx

- [ ] 5-step numbered checklist
- [ ] Clickable research URLs (open in new tab)
- [ ] Status indicators (completed/pending)

### Task 3.7 — NegotiationPanel.tsx

- [ ] Target / Opening / Walk-away prices
- [ ] Leverage points from issues
- [ ] Do-Not list
- [ ] Printable negotiation card

### Task 3.8 — FinalVerdictPanel.tsx

- [ ] Buy If / Walk Away If structured lists
- [ ] Red flags summary
- [ ] Confidence meter (visual gauge)

### Task 3.9 — ConditionPanel.tsx

- [ ] Display manual condition notes
- [ ] Expected condition checklist
- [ ] Future: photo analysis results

### Task 3.10 — SellerVerificationPanel.tsx

- [ ] Display seller communication summary
- [ ] Red flag indicators

### Task 3.11 — Wire all panels into AnalysisResults.tsx

- [ ] Add CollapsibleSection for each new panel
- [ ] Maintain consistent styling
- [ ] Proper ordering to match template

**Files:** New files in `src/components/`, updated `AnalysisResults.tsx`
**Acceptance:** All 11+ sections visible in results with proper data.

---

## Phase 4: Report Download & Export (Priority: MEDIUM-HIGH)

### Task 4.1 — Upgrade report generation

- [ ] Replace plain .txt with structured formatted report
- [ ] Include ALL sections from the analysis
- [ ] Proper headings, tables, bullet points
- [ ] Match the template structure from the requirements doc

### Task 4.2 — Research URL generation

- [ ] Auto-generate clickable links:
  - Carfax VIN check URL
  - KBB value lookup URL
  - Edmunds review URL
  - Consumer Reports URL
  - Google search for "[year] [make] [model] common problems"
  - NHTSA complaints URL
- [ ] Display in Action Plan section + include in report

### Task 4.3 — CSV Export for comparison

- [ ] Export saved vehicles as CSV
- [ ] Columns: all input fields + key metrics (equity, verdict, payback)

**Files:** `AnalysisResults.tsx` (download function), new `src/lib/report-generator.ts`, new `src/lib/research-urls.ts`
**Acceptance:** Download produces comprehensive formatted report with all sections.

---

## Phase 5: Image Upload & Advanced Features (Priority: MEDIUM)

### Task 5.1 — Image upload component

- [ ] Create `ImageUploader.tsx`
- [ ] Drag & drop zone + file browser
- [ ] Accept JPEG, PNG, WebP
- [ ] Thumbnail gallery preview
- [ ] Store in browser memory (base64 or object URLs)

### Task 5.2 — Rideshare vs Personal Use toggle

- [ ] Add toggle to form or results
- [ ] When "Personal Use": hide rideshare sections, show personal cost projections
- [ ] When "Rideshare": show full rideshare analysis

### Task 5.3 — Multi-vehicle comparison

- [ ] Create `ComparisonView.tsx`
- [ ] Select 2-5 vehicles from history
- [ ] Side-by-side table: price, mileage, equity, verdict, payback
- [ ] Stack rank by configurable criteria

### Task 5.4 — Bulk import (Phase 2 feature)

- [ ] Accept Excel/CSV upload
- [ ] Parse rows into Vehicle objects
- [ ] Select vehicles to analyze
- [ ] Batch report generation

### Task 5.5 — Seller Verification pop-up (optional enhancement)

- [ ] Modal dialog during report generation
- [ ] Quick-fill seller communication data
- [ ] "Skip for Now" option

**Files:** New components, updated `page.tsx`
**Acceptance:** Image upload works, toggle switches analysis mode, comparison view functional.

---

## Execution Order

| Step | Phase | Tasks | Est. Effort |
|------|-------|-------|-------------|
| **1** | Phase 1 | Add 6 missing input fields | ~20 min |
| **2** | Phase 2.1-2.8 | Build all analysis modules | ~60 min |
| **3** | Phase 2.9-2.11 | Condition & seller fields + wire analyze.ts | ~20 min |
| **4** | Phase 3.1-3.10 | Build all UI panels | ~45 min |
| **5** | Phase 3.11 | Wire panels into results page | ~15 min |
| **6** | Phase 4.1-4.3 | Report generation + URLs + CSV | ~30 min |
| **7** | Phase 5.1-5.2 | Image upload + rideshare toggle | ~25 min |
| **8** | Phase 5.3 | Multi-vehicle comparison | ~30 min |
| **9** | Phase 5.4-5.5 | Bulk import + seller modal | ~30 min |

**Total estimated:** ~4.5 hours of implementation

---

## File Manifest (New + Modified)

### New Files

- `src/lib/scenarios.ts`
- `src/lib/break-even.ts`
- `src/lib/operational-costs.ts`
- `src/lib/initial-investment.ts`
- `src/lib/action-plan.ts`
- `src/lib/negotiation.ts`
- `src/lib/research-urls.ts`
- `src/lib/report-generator.ts`
- `src/components/ScenarioAnalysisPanel.tsx`
- `src/components/BreakEvenPanel.tsx`
- `src/components/OperationalCostsPanel.tsx`
- `src/components/InitialInvestmentPanel.tsx`
- `src/components/PaybackPanel.tsx`
- `src/components/ActionPlanPanel.tsx`
- `src/components/NegotiationPanel.tsx`
- `src/components/FinalVerdictPanel.tsx`
- `src/components/ConditionPanel.tsx`
- `src/components/SellerVerificationPanel.tsx`
- `src/components/ImageUploader.tsx`
- `src/components/ComparisonView.tsx`

### Modified Files

- `src/lib/types.ts` — New interfaces + extended Vehicle/AnalysisResult
- `src/lib/analyze.ts` — Call all new modules
- `src/lib/rideshare.ts` — Payback + initial investment
- `src/lib/vin-decoder.ts` — Fill transmission/fuelType
- `src/components/VehicleForm.tsx` — All 15 fields + condition/seller sections
- `src/components/AnalysisResults.tsx` — Wire all new panels
- `src/app/page.tsx` — Toggle, comparison, image state
