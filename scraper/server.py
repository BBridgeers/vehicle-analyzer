
#!/usr/bin/env python3
"""
FB Marketplace Stealth Scraper API
===================================
FastAPI REST server that veracar.co calls to scrape FB Marketplace.
Runs on VPS (NOT Vercel) because we need real Chrome + persistent sessions.

Endpoints:
  POST /api/scrape/search    — Search FB Marketplace for vehicles
  POST /api/scrape/detail    — Scrape individual listing detail
  GET  /api/scrape/health    — Health check
  GET  /api/scrape/sessions  — List saved sessions

MEEEOOOWWWWW 🔥
"""

import os
import sys
import json
import time
import asyncio
# Ensure scraper module is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn

from fb_marketplace import FBMarketplaceScraper, scrape_listing_detail, SessionManager
from fastapi import Query
from craigslist_search import search_craigslist

# ─── Data Models ───────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(default="", description="Search terms (make, model, etc.)")
    location: str = Field(default="dallas", description="City or region")
    max_price: Optional[int] = Field(default=None, description="Maximum price in USD")
    min_price: Optional[int] = Field(default=None, description="Minimum price in USD")
    max_mileage: Optional[int] = Field(default=None, description="Max mileage")
    min_year: Optional[int] = Field(default=None, description="Minimum year")
    max_results: int = Field(default=20, le=50, description="Max listings to return")
    session_id: str = Field(default="default", description="Session ID for cookie persistence")
    prefer_strategy: Optional[str] = Field(default=None, description="Force a specific strategy")

class DetailRequest(BaseModel):
    url: str = Field(..., description="FB Marketplace listing URL")
    session_id: str = Field(default="default")
    two_factor_code: Optional[str] = Field(default=None, description="Optional 2FA code for Facebook authentication")

class CraigslistSearchRequest(BaseModel):
    city: str = Field(default="dallas", description="City for Craigslist subdomain")
    query: str = Field(default="", description="Search terms")
    min_price: Optional[int] = Field(default=None)
    max_price: Optional[int] = Field(default=None)
    min_year: Optional[int] = Field(default=None)
    max_year: Optional[int] = Field(default=None)
    max_mileage: Optional[int] = Field(default=None)
    max_results: int = Field(default=30, le=50)

class SearchResponse(BaseModel):
    success: bool
    listings: List[dict] = []
    strategy_used: Optional[str] = None
    total_found: int = 0
    elapsed_seconds: float = 0
    search_url: str = ""
    error: Optional[str] = None

class DetailResponse(BaseModel):
    success: bool
    listing: Optional[dict] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    sessions_count: int
    uptime_seconds: float

# ─── App Setup ────────────────────────────────────────────────────────────

app = FastAPI(
    title="FB Marketplace Stealth Scraper",
    description="Bleeding-edge stealth browser scraping API for Facebook Marketplace",
    version="1.0.0-meeow",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_manager = SessionManager()
start_time = asyncio.get_event_loop().time() if asyncio.get_event_loop().is_running() else __import__("time").time()

# ─── Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/scrape/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    sessions = list(session_manager.session_dir.glob("*/cookies.json"))
    uptime = __import__("time").time() - start_time if not asyncio.get_event_loop().is_running() else 0
    return HealthResponse(
        status="purring",
        sessions_count=len(sessions),
        uptime_seconds=round(uptime, 1),
    )

@app.get("/api/scrape/sessions")
async def list_sessions():
    """List all saved browser sessions."""
    sessions = {}
    for session_dir in session_manager.session_dir.iterdir():
        if session_dir.is_dir():
            state = session_manager.load_state(session_dir.name)
            cookies = session_manager.load_cookies(session_dir.name)
            sessions[session_dir.name] = {
                "has_cookies": len(cookies) > 0,
                "cookie_count": len(cookies),
                "last_used": state.get("updated_at", "never"),
            }
    return {"sessions": sessions}

@app.post("/api/scrape/search", response_model=SearchResponse)
async def search_marketplace(request: SearchRequest):
    """Search FB Marketplace for vehicles. Cascades through stealth strategies."""
    try:
        scraper = FBMarketplaceScraper(
            session_id=request.session_id,
            headless=True,
            debug=True,
        )

        result = await scraper.search(
            query=request.query,
            location=request.location,
            max_price=request.max_price,
            min_price=request.min_price,
            max_mileage=request.max_mileage,
            min_year=request.min_year,
            max_results=request.max_results,
            prefer_strategy=request.prefer_strategy,
        )

        return SearchResponse(
            success=True,
            listings=result["listings"],
            strategy_used=result["strategy_used"],
            total_found=result["total_found"],
            elapsed_seconds=result["elapsed_seconds"],
            search_url=result["search_url"],
        )

    except Exception as e:
        return SearchResponse(
            success=False,
            error=str(e),
        )

@app.post("/api/scrape/detail", response_model=DetailResponse)
async def scrape_detail(request: DetailRequest):
    """Scrape a single FB Marketplace listing for full details."""
    try:
        listing = await scrape_listing_detail(request.url, request.session_id, request.two_factor_code)

        if not listing or not listing.get("title"):
            return DetailResponse(success=False, error="Could not extract listing data")

        return DetailResponse(success=True, listing=listing)

    except Exception as e:
        return DetailResponse(success=False, error=str(e))


@app.post("/api/scrape/craigslist/search", response_model=SearchResponse)
async def craigslist_search(request: CraigslistSearchRequest):
    """Search Craigslist for vehicles. Uses JSON-LD parsing (fast, no browser needed)."""
    start = time.time()
    try:
        results = search_craigslist(
            city=request.city,
            query=request.query,
            min_price=request.min_price,
            max_price=request.max_price,
            min_year=request.min_year,
            max_year=request.max_year,
            max_mileage=request.max_mileage,
            max_results=request.max_results,
        )
        elapsed = time.time() - start
        return SearchResponse(
            success=True,
            listings=results,
            strategy_used="craigslist_jsonld",
            total_found=len(results),
            elapsed_seconds=round(elapsed, 2),
            search_url=f"https://{request.city}.craigslist.org/search/cta?query={request.query}",
        )
    except Exception as e:
        return SearchResponse(success=False, error=str(e))


# ─── Main ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("SCRAPER_PORT", 8765))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
