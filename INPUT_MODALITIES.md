# Input Modalities — Vehicle Analyzer

## Primary Entry Points (5 Modalities)

| # | Modality | Input Source | Extracts | API Route |
|---|----------|--------------|----------|-----------|
| **1** | **VIN** | 17-char Vehicle ID | Year, Make, Model, Trim, engine, Doors, FuelType, transmissions, recalls | `/api/vin` |
| **2** | **Listing URL** | FB Marketplace, Craigslist, etc. | Listing data (price, mileage, location, title status) | Scrape auto-detects platform |
| **3** | **Reference URL** | Any external listing URL | Extracted listing data via web search | `/api/scrape/extract` |
| **4** | **Listing Screenshot** | Upload/dragimage | Vision OCR → listing fields | Vision OCR pipeline |
| **5** | **Vehicle Photos** | Multi-file images | Car condition analysis | Vision analysis |
| **6** | **CARFAX Report** | PDF upload | Full history, repairs, title, accidents | `/api/analyze-carfax` |

## Secondary/Helper Inputs

| Modality | Description |
|----------|-------------|
| **Quick Reference URL** | Extra data source (optional) |
| **Scrape URL** | Scrape from specific listing URL |

## VIN Decode Fields (NHTSA API)
Auto-fills 25+ fields: Year, Make, Model, Trim, BodyClass, Doors, Engine, FuelType, Transmission, DriveType, SteeringType, SeatBelts, AirBags, MSRP, etc.

## CARFAX PDF Extraction
Text extraction via pdfjs + pdf-parse → fallback to Groq Vision OCR for image-based PDFs → extracts title status, accidents, repairs, ownership history.

## Scrape Platform Auto-Detect
Automatic platform detection: Facebook Marketplace, Craigslist, AutoTempest, etc.

## Rate Limits (per user)
- VIN decode: 100 entries/day
- Scraping/Extraction: 20/hr
- Carfax/PDF analysis: 10/hr
