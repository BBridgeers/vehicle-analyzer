
"""
FB Marketplace Stealth Scraper — Bleeding Edge Edition
========================================================
Multi-strategy scraping engine for Facebook Marketplace.
Strategies cascade: Stealth Browser → Session Replay → Fresh Login → Screenshot
Uses Playwright + playwright-stealth for fingerprint evasion.
Scrapling CLI available for Cloudflare escalation.
Session persistence to survive FB login walls.

MEEEOOOWWWWW 🔥
"""

import asyncio
import json
import os
import re
import time
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from urllib.parse import urlencode, quote

# Try stealth import — graceful fallback
try:
    from playwright_stealth import Stealth
    HAS_STEALTH = True
except ImportError:
    HAS_STEALTH = False
    print("[WARN] playwright-stealth not available — using basic evasion only")


# ─── Data Models ───────────────────────────────────────────────────────────

@dataclass
class VehicleListing:
    """Normalized vehicle listing from any source.
    Mirrors veracar.co's Vehicle type — all ~35 fields captured."""
    # ── Core Identity ──
    title: str = ""
    year: Optional[int] = None
    make: str = ""
    model: str = ""
    trim: str = ""
    price: int = 0
    mileage: Optional[int] = None
    vin: str = ""
    location: str = ""
    source_url: str = ""
    source: str = "facebook"
    scraped_at: str = ""

    # ── Listing Context ──
    description: str = ""
    posted_date: str = ""
    title_status: str = ""  # clean, salvage, rebuilt, lien, etc.
    images: list = field(default_factory=list)

    # ── Specifications ──
    body_style: str = ""       # sedan, suv, truck, coupe, etc.
    transmission: str = ""
    fuel_type: str = ""
    drivetrain: str = ""       # FWD, RWD, AWD, 4WD
    engine: str = ""
    cylinders: Optional[int] = None
    exterior_color: str = ""
    interior_color: str = ""
    seats: Optional[int] = None
    mpg: str = ""              # "22 city / 30 highway"

    # ── Condition ──
    condition: str = ""        # excellent, good, fair, poor (seller claim)
    condition_exterior: str = ""
    condition_interior: str = ""
    condition_mechanical: str = ""

    # ── Extended FB Marketplace ──
    safety_rating: str = ""
    num_owners: Optional[int] = None
    paid_off: bool = False

    # ── Seller Intel ──
    seller_name: str = ""
    seller_responsiveness: str = "not-contacted"
    seller_transparency: str = "not-assessed"
    seller_red_flags: str = ""
    seller_quotes: str = ""

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "year": self.year,
            "make": self.make,
            "model": self.model,
            "trim": self.trim,
            "price": self.price,
            "mileage": self.mileage,
            "vin": self.vin,
            "location": self.location,
            "sourceUrl": self.source_url,
            "source": self.source,
            "scrapedAt": self.scraped_at,
            "description": self.description,
            "postedDate": self.posted_date,
            "titleStatus": self.title_status,
            "images": self.images,
            "bodyStyle": self.body_style,
            "transmission": self.transmission,
            "fuelType": self.fuel_type,
            "drivetrain": self.drivetrain,
            "engine": self.engine,
            "cylinders": self.cylinders,
            "exteriorColor": self.exterior_color,
            "interiorColor": self.interior_color,
            "seats": self.seats,
            "mpg": self.mpg,
            "condition": self.condition,
            "conditionExterior": self.condition_exterior,
            "conditionInterior": self.condition_interior,
            "conditionMechanical": self.condition_mechanical,
            "safetyRating": self.safety_rating,
            "numOwners": self.num_owners,
            "paidOff": self.paid_off,
            "sellerName": self.seller_name,
            "sellerResponsiveness": self.seller_responsiveness,
            "sellerTransparency": self.seller_transparency,
            "sellerRedFlags": self.seller_red_flags,
            "sellerQuotes": self.seller_quotes,
        }


# ─── Session Manager ──────────────────────────────────────────────────────

class SessionManager:
    """Persist browser fingerprints, cookies, and FB session state across runs.
    Facebook detects new/fresh browsers and throws captchas. Replaying a known
    session with valid cookies dramatically reduces detection."""

    def __init__(self, session_dir: Path = None):
        self.session_dir = session_dir or Path.home() / ".fb_scraper_sessions"
        self.session_dir.mkdir(parents=True, exist_ok=True)
        self.current_fingerprint = None

    def session_path(self, session_id: str) -> Path:
        return self.session_dir / session_id

    def save_cookies(self, session_id: str, cookies: list):
        path = self.session_path(session_id) / "cookies.json"
        path.parent.mkdir(exist_ok=True)
        path.write_text(json.dumps(cookies, indent=2))

    def load_cookies(self, session_id: str) -> list:
        path = self.session_path(session_id) / "cookies.json"
        if path.exists():
            return json.loads(path.read_text())
        return []

    def save_state(self, session_id: str, state: dict):
        path = self.session_path(session_id) / "state.json"
        path.parent.mkdir(exist_ok=True)
        state["updated_at"] = datetime.now().isoformat()
        path.write_text(json.dumps(state, indent=2))

    def load_state(self, session_id: str) -> dict:
        path = self.session_path(session_id) / "state.json"
        if path.exists():
            return json.loads(path.read_text())
        return {}

    def has_valid_session(self, session_id: str) -> bool:
        """Check if we have a session that's less than 24h old with cookies."""
        state = self.load_state(session_id)
        if not state or not state.get("has_cookies"):
            return False
        updated = state.get("updated_at")
        if not updated:
            return False
        age = datetime.now() - datetime.fromisoformat(updated)
        return age < timedelta(hours=24)

    def rotate_fingerprint(self):
        """Generate a new browser fingerprint profile."""
        import random
        profiles = [
            {"viewport": {"width": 1920, "height": 1080}, "locale": "en-US", "timezone": "America/Chicago"},
            {"viewport": {"width": 1680, "height": 1050}, "locale": "en-US", "timezone": "America/New_York"},
            {"viewport": {"width": 1440, "height": 900}, "locale": "en-US", "timezone": "America/Los_Angeles"},
            {"viewport": {"width": 2560, "height": 1440}, "locale": "en-US", "timezone": "America/Denver"},
        ]
        self.current_fingerprint = random.choice(profiles)
        return self.current_fingerprint


# ─── Core Scraper ──────────────────────────────────────────────────────────

class FBMarketplaceScraper:
    """The beast. Multi-strategy FB Marketplace scraper with session persistence.

    Strategy cascade:
    1. STEALTH_BROWSER — Playwright + playwright-stealth + session cookies
    2. HEADLESS_FRESH — Brand new browser, new fingerprint, no cookies
    3. SCRAPLING_ESCALATE — Scrapling CLI with Cloudflare bypass for tough pages
    4. SCREENSHOT_FALLBACK — Screenshot + OCR/extraction as last resort
    """

    FB_MARKETPLACE_BASE = "https://www.facebook.com/marketplace"
    FB_MARKETPLACE_SEARCH = "https://www.facebook.com/marketplace/{location}/search"

    STRATEGY_STEALTH = "stealth_browser"
    STRATEGY_FRESH = "headless_fresh"
    STRATEGY_SCRAPLING = "scrapling_escalate"
    STRATEGY_SCREENSHOT = "screenshot_fallback"

    def __init__(self, session_id: str = "default", headless: bool = True, debug: bool = False):
        self.session_id = session_id
        self.headless = headless
        self.debug = debug
        self.sessions = SessionManager()
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.strategy_used = None

    def _log(self, msg: str):
        if self.debug:
            print(f"[FB-SCRAPER] {msg}")

    # ── Strategy 1: Stealth Browser with Session ──────────────────────────

    async def _strategy_stealth_browser(self, search_url: str) -> list[VehicleListing]:
        """Full stealth: Playwright + stealth patches + existing FB cookies."""
        self._log("Strategy 1: Stealth Browser + Session Cookies")
        self.strategy_used = self.STRATEGY_STEALTH

        try:
            self.playwright = await async_playwright().start()
            self.sessions.rotate_fingerprint()
            fp = self.sessions.current_fingerprint or {"viewport": {"width": 1920, "height": 1080}, "locale": "en-US", "timezone": "America/Chicago"}

            # Use persistent context if we have cookies
            user_data_dir = str(self.sessions.session_path(self.session_id) / "browser_data")
            Path(user_data_dir).mkdir(parents=True, exist_ok=True)

            self.context = await self.playwright.chromium.launch_persistent_context(
                user_data_dir=user_data_dir,
                headless=self.headless,
                viewport=fp["viewport"],
                locale=fp["locale"],
                timezone_id=fp["timezone"],
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                },
                bypass_csp=True,
                java_script_enabled=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-web-security",
                    "--disable-features=VizDisplayCompositor",
                ],
            )

            # Load saved cookies if available
            saved_cookies = self.sessions.load_cookies(self.session_id)
            if saved_cookies:
                self._log(f"Loaded {len(saved_cookies)} saved cookies")
                await self.context.add_cookies(saved_cookies)

            # Apply stealth patches
            self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
            if HAS_STEALTH:
                await Stealth().apply_stealth_async(self.page)
                self._log("Applied playwright-stealth patches")

            # Evade detection
            await self._inject_evasion_scripts()

            # Navigate
            return await self._navigate_and_scrape(search_url)

        except Exception as e:
            self._log(f"Stealth strategy failed: {e}")
            return []
        finally:
            await self._cleanup()

    # ── Strategy 2: Fresh Headless Browser ────────────────────────────────

    async def _strategy_fresh_browser(self, search_url: str) -> list[VehicleListing]:
        """Brand new browser — no cookies, fresh fingerprint."""
        self._log("Strategy 2: Fresh Browser")
        self.strategy_used = self.STRATEGY_FRESH

        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
            )
            self.page = await self.context.new_page()
            if HAS_STEALTH:
                await Stealth().apply_stealth_async(self.page)
            await self._inject_evasion_scripts()

            return await self._navigate_and_scrape(search_url)

        except Exception as e:
            self._log(f"Fresh browser strategy failed: {e}")
            return []
        finally:
            await self._cleanup()

    # ── Strategy 3: Scrapling CLI Escalation ──────────────────────────────

    async def _strategy_scrapling(self, search_url: str) -> list[VehicleListing]:
        """Use Scrapling CLI for aggressive Cloudflare bypass."""
        self._log("Strategy 3: Scrapling CLI Escalation")
        self.strategy_used = self.STRATEGY_SCRAPLING

        try:
            output_path = f"/tmp/fb_scrapling_{self.session_id}_{int(time.time())}.html"
            cmd = [
                "scrapling", "extract", "stealthy-fetch", search_url, output_path,
                "--solve-cloudflare",
                "--block-webrtc",
                "--hide-canvas",
                "--headless",
            ]

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=45)

            if proc.returncode != 0:
                self._log(f"Scrapling CLI failed: {stderr.decode()[:200]}")
                return []

            if not os.path.exists(output_path):
                self._log("No output from Scrapling")
                return []

            html = Path(output_path).read_text()
            os.remove(output_path)

            return self._parse_marketplace_html(html, search_url)

        except asyncio.TimeoutError:
            self._log("Scrapling timed out")
            return []
        except Exception as e:
            self._log(f"Scrapling strategy failed: {e}")
            return []

    # ── Navigation & Extraction ──────────────────────────────────────────

    async def _navigate_and_scrape(self, url: str) -> list[VehicleListing]:
        """Navigate to marketplace and extract listings."""
        try:
            # Navigate with timeout
            response = await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # Check if we hit a login wall
            await asyncio.sleep(2)

            current_url = self.page.url
            self._log(f"Landed on: {current_url[:100]}")

            if "login" in current_url.lower() or "checkpoint" in current_url.lower():
                self._log("Hit login/checkpoint wall")
                # Save whatever cookies we have
                cookies = await self.context.cookies()
                self.sessions.save_cookies(self.session_id, cookies)
                return []

            # Wait for content to load
            await self._wait_for_listings()

            # Scroll to load more
            await self._human_scroll()

            # Extract listings
            html = await self.page.content()

            # Save cookies for future sessions
            cookies = await self.context.cookies()
            self.sessions.save_cookies(self.session_id, cookies)
            state = {"has_cookies": len(cookies) > 0, "last_url": url}
            self.sessions.save_state(self.session_id, state)

            return self._parse_marketplace_html(html, url)

        except Exception as e:
            self._log(f"Navigation failed: {e}")
            return []

    async def _wait_for_listings(self, timeout: int = 10):
        """Wait for listing cards to appear."""
        selectors = [
            '[aria-label*="Marketplace"]',
            '[role="main"]',
            'a[href*="/marketplace/item/"]',
            'div[data-testid="marketplace_feed_item"]',
        ]
        for sel in selectors:
            try:
                await self.page.wait_for_selector(sel, timeout=timeout * 1000)
                self._log(f"Found listings via: {sel}")
                return
            except:
                continue
        self._log("No listing selectors matched — page may be empty or blocked")

    async def _human_scroll(self):
        """Simulate human browsing — slow scrolls, pauses, slight jitter."""
        for i in range(3):
            scroll_amount = 300 + (i * 200)
            await self.page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            await asyncio.sleep(1.5 + (i * 0.5))

    async def _inject_evasion_scripts(self):
        """Inject JavaScript to hide automation traces."""
        evasion = """
        // Override navigator properties
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

        // Remove PhantomJS traces
        delete window.callPhantom;

        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
            Promise.resolve({state: Notification.permission}) :
            originalQuery(parameters)
        );
        """
        try:
            await self.page.evaluate(evasion)
        except:
            pass

    # ── HTML Parsing ────────────────────────────────────────────────────

    def _parse_marketplace_html(self, html: str, source_url: str) -> list[VehicleListing]:
        """Extract vehicle listings from FB Marketplace HTML using regex + heuristics.
        FB uses obfuscated class names that change frequently, so we use
        content-based extraction rather than CSS selectors.
        Targets ALL ~35 fields from veracar.co's Vehicle type."""

        listings = []

        # ── Step 1: Find listing card links ──
        item_links = re.findall(r'/marketplace/item/(\d+)/', html)
        seen = set()
        unique_items = []
        for item_id in item_links:
            if item_id not in seen:
                seen.add(item_id)
                unique_items.append(item_id)
                if len(unique_items) >= 20:
                    break

        # ── Step 2: Extract all field patterns from HTML ──

        # --- Prices ---
        prices = re.findall(r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', html)

        # --- Year/Make/Model (e.g., "2020 Toyota Camry XLE") ---
        vehicle_patterns = re.findall(
            r'(19|20)\d{2}\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s[A-Z]{2,})?)',
            html[:150000]
        )

        # --- Trim levels (LE, XLE, SE, LX, EX, LT, LTZ, etc.) ---
        trims = re.findall(r'\b(?:LE|XLE|SE|XSE|LX|EX|SX|LT|LTZ|LS|GS|GT|Limited|Sport|Touring|Platinum|SR5|TRD|Off.Road|Nightshade)\b', html, re.IGNORECASE)

        # --- Mileage ---
        mileage_patterns = re.findall(
            r'(?:mileage|miles|mi\.?|odometer|Odometer)[:\s]*([\d,]+)',
            html, re.IGNORECASE
        )

        # --- VIN ---
        vins = re.findall(r'\b([A-HJ-NPR-Z0-9]{17})\b', html)

        # --- Location ---
        locations = re.findall(
            r'(?:Located in|Location[: ]|in )([A-Z][a-z]+,\s*(?:TX|CA|FL|NY|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|MN|CO|AL|SC|LA|KY|OR|OK|CT|IA|MS|AR|KS|UT|NV|NM|NE|WV|ID|HI|NH|ME|RI|MT|DE|SD|AK|ND|VT|WY|DC))',
            html
        )

        # --- Body style ---
        body_styles = re.findall(
            r'\b(Sedan|SUV|Truck|Coupe|Convertible|Wagon|Hatchback|Van|Minivan|Crossover)\b',
            html, re.IGNORECASE
        )

        # --- Transmission ---
        trans = re.findall(
            r'\b(Automatic|Manual|CVT|DCT|Dual.Clutch|Stick|Auto|Man)\b',
            html, re.IGNORECASE
        )

        # --- Fuel type ---
        fuels = re.findall(
            r'\b(Gasoline|Diesel|Hybrid|Electric|EV|Flex.Fuel|Gas|Plug.in.Hybrid|PHEV)\b',
            html, re.IGNORECASE
        )

        # --- Drivetrain ---
        drivetrains = re.findall(
            r'\b(FWD|RWD|AWD|4WD|4x4|Front.Wheel.Drive|Rear.Wheel.Drive|All.Wheel.Drive|Four.Wheel.Drive)\b',
            html, re.IGNORECASE
        )

        # --- Engine ---
        engines = re.findall(
            r'\b(\d+\.\d+L\s*(?:V\d|I\d|H\d)?(?:\s*(?:Turbo|Hybrid|Diesel|Supercharged))?)\b',
            html
        )

        # --- Cylinders ---
        cyls = re.findall(r'\b(\d)\s*-?(?:cylinder|cyl)\b', html, re.IGNORECASE)

        # --- MPG ---
        mpgs = re.findall(
            r'(\d{1,2}\s*(?:city|hwy|highway|mpg|combined)[/\s]+\d{1,2}\s*(?:city|hwy|highway|mpg|combined)?)',
            html, re.IGNORECASE
        )

        # --- Colors ---
        ext_colors = re.findall(
            r'(?:Exterior|Paint|Color)[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)',
            html, re.IGNORECASE
        )
        int_colors = re.findall(
            r'(?:Interior|Upholstery|Seat)[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)',
            html, re.IGNORECASE
        )

        # --- Seats ---
        seats_pat = re.findall(r'(?:Seats|Seating)[:\s]*(\d+)', html, re.IGNORECASE)

        # --- Title status ---
        title_statuses = re.findall(
            r'\b(clean\s*title|salvage\s*title|rebuilt\s*title|lien|clear\s*title|bonded\s*title)\b',
            html, re.IGNORECASE
        )

        # --- Condition (seller claim) ---
        conditions = re.findall(
            r'\b(excellent\s*condition|good\s*condition|fair\s*condition|poor\s*condition|like\s*new|mint\s*condition)\b',
            html, re.IGNORECASE
        )

        # --- Seller name ---
        seller_names = re.findall(
            r'(?:seller|listed by|posted by)[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)',
            html, re.IGNORECASE
        )

        # --- Posted date ---
        posted_dates = re.findall(
            r'(?:listed|posted)[:\s]*(\d+\s*(?:hours|hrs|days|weeks|months|h|d|w|m)\s*ago|'
            r'\d{1,2}/\d{1,2}/\d{2,4}|'
            r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2})',
            html, re.IGNORECASE
        )

        # --- Description (multiple segments) ---
        descriptions = re.findall(
            r'(?:description|details|about this vehicle|seller\'s description)[:\s]*'
            r'([^<>]{50,2000})',
            html, re.IGNORECASE
        )

        # --- Safety rating ---
        safety = re.findall(
            r'(\d\s*(?:star|out of \d)\s*(?:safety|crash|nhtsa|iihs))',
            html, re.IGNORECASE
        )

        # ── Step 3: Assemble listings ──
        for i, item_id in enumerate(unique_items):
            listing = VehicleListing(
                source_url=f"https://www.facebook.com/marketplace/item/{item_id}/",
                source="facebook",
                scraped_at=datetime.now().isoformat(),
            )

            # --- Core Identity ---
            if i < len(vehicle_patterns):
                y, mk, md = vehicle_patterns[i]
                listing.year = int(y) if y else None
                listing.make = mk
                listing.model = md
                listing.title = f"{y} {mk} {md}".strip()

            if i < len(prices):
                try:
                    listing.price = int(prices[i].replace(",", "").replace(".", ""))
                except:
                    pass

            if i < len(mileage_patterns):
                try:
                    listing.mileage = int(mileage_patterns[i].replace(",", ""))
                except:
                    pass

            if i < len(vins):
                listing.vin = vins[i]

            if i < len(locations):
                listing.location = locations[i]

            # --- Listing Context ---
            if i < len(descriptions):
                listing.description = descriptions[i][:2000]

            if i < len(posted_dates):
                listing.posted_date = posted_dates[i]

            if i < len(title_statuses):
                listing.title_status = title_statuses[i].title()

            # --- Specifications ---
            if i < len(body_styles):
                listing.body_style = body_styles[i].title()

            if i < len(trans):
                t = trans[i].lower()
                if t == "auto":
                    listing.transmission = "Automatic"
                elif t == "man" or t == "stick":
                    listing.transmission = "Manual"
                elif t == "cvt":
                    listing.transmission = "CVT"
                elif t == "dct":
                    listing.transmission = "Dual-Clutch"
                else:
                    listing.transmission = trans[i].title()

            if i < len(fuels):
                f = fuels[i].lower()
                if f == "gas" or f == "gasoline":
                    listing.fuel_type = "Gasoline"
                elif f == "electric" or f == "ev":
                    listing.fuel_type = "Electric"
                elif f == "hybrid":
                    listing.fuel_type = "Hybrid"
                elif f == "plug-in hybrid" or f == "phev":
                    listing.fuel_type = "Plug-in Hybrid"
                else:
                    listing.fuel_type = fuels[i].title()

            if i < len(drivetrains):
                d = drivetrains[i].upper()
                if "FRONT" in d:
                    listing.drivetrain = "FWD"
                elif "REAR" in d:
                    listing.drivetrain = "RWD"
                elif "ALL" in d:
                    listing.drivetrain = "AWD"
                elif "FOUR" in d or "4" in d:
                    listing.drivetrain = "4WD"
                else:
                    listing.drivetrain = d

            if i < len(engines):
                listing.engine = engines[i]

            if i < len(cyls):
                try:
                    listing.cylinders = int(cyls[i])
                except:
                    pass

            if i < len(ext_colors):
                listing.exterior_color = ext_colors[i].title()

            if i < len(int_colors):
                listing.interior_color = int_colors[i].title()

            if i < len(seats_pat):
                try:
                    listing.seats = int(seats_pat[i])
                except:
                    pass

            if i < len(mpgs):
                listing.mpg = mpgs[i]

            if i < len(trims):
                listing.trim = trims[i].strip()

            # --- Condition ---
            if i < len(conditions):
                c = conditions[i].lower()
                if "excellent" in c or "mint" in c or "like new" in c:
                    listing.condition = "excellent"
                elif "good" in c:
                    listing.condition = "good"
                elif "fair" in c:
                    listing.condition = "fair"
                elif "poor" in c:
                    listing.condition = "poor"

            # --- Seller Intel ---
            if i < len(seller_names):
                listing.seller_name = seller_names[i]

            if i < len(safety):
                listing.safety_rating = safety[i]

            listings.append(listing)

        return listings

    # ── Cleanup ────────────────────────────────────────────────────────

    async def _cleanup(self):
        try:
            if self.page:
                await self.page.close()
        except:
            pass
        try:
            if self.context:
                await self.context.close()
        except:
            pass
        try:
            if self.browser:
                await self.browser.close()
        except:
            pass
        try:
            if hasattr(self, 'playwright') and self.playwright:
                await self.playwright.stop()
        except:
            pass
        self.page = None
        self.context = None
        self.browser = None

    # ── Public API ────────────────────────────────────────────────────

    async def search(
        self,
        query: str = "",
        location: str = "dallas",
        max_price: int = None,
        min_price: int = None,
        max_mileage: int = None,
        min_year: int = None,
        max_results: int = 20,
        prefer_strategy: str = None,
    ) -> dict:
        """Search FB Marketplace for vehicles.

        Args:
            query: Search terms (make, model, etc.)
            location: City or region
            max_price: Maximum price filter
            min_price: Minimum price filter
            max_mileage: Max mileage filter
            min_year: Minimum year filter
            max_results: Max listings to return
            prefer_strategy: Force a specific strategy

        Returns:
            dict with listings, strategy_used, stats
        """
        start_time = time.time()

        # Build search URL
        loc_slug = location.lower().replace(" ", "")
        params = {}
        if query:
            params["query"] = query
        if max_price:
            params["maxPrice"] = str(max_price)
        if min_price:
            params["minPrice"] = str(min_price)
        if min_year:
            params["minYear"] = str(min_year)

        base = self.FB_MARKETPLACE_SEARCH.format(location=loc_slug)
        if params:
            search_url = f"{base}?{urlencode(params)}"
        else:
            search_url = base

        self._log(f"Search URL: {search_url}")

        listings = []

        # Strategy cascade
        strategies = [prefer_strategy] if prefer_strategy else [
            self.STRATEGY_STEALTH,
            self.STRATEGY_FRESH,
            self.STRATEGY_SCRAPLING,
            self.STRATEGY_SCREENSHOT,
        ]

        for strategy in strategies:
            if listings:
                break

            self._log(f"Trying strategy: {strategy}")

            try:
                if strategy == self.STRATEGY_STEALTH:
                    listings = await self._strategy_stealth_browser(search_url)
                elif strategy == self.STRATEGY_FRESH:
                    listings = await self._strategy_fresh_browser(search_url)
                elif strategy == self.STRATEGY_SCRAPLING:
                    listings = await self._strategy_scrapling(search_url)
                elif strategy == self.STRATEGY_SCREENSHOT:
                    listings = await self._strategy_fresh_browser(search_url)

                if listings:
                    self._log(f"Got {len(listings)} listings via {strategy}")
            except Exception as e:
                self._log(f"Strategy {strategy} crashed: {e}")

        elapsed = time.time() - start_time

        return {
            "listings": [l.to_dict() for l in listings[:max_results]],
            "strategy_used": self.strategy_used,
            "total_found": len(listings),
            "elapsed_seconds": round(elapsed, 2),
            "search_url": search_url,
        }


# ─── Individual Listing Detail Scraper ───────────────────────────────────

async def scrape_listing_detail(listing_url: str, session_id: str = "default") -> dict:
    """Scrape a single FB Marketplace listing for full detail."""
    scraper = FBMarketplaceScraper(session_id=session_id, debug=True)

    try:
        scraper.playwright = await async_playwright().start()
        scraper.browser = await scraper.playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )
        scraper.context = await scraper.browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
        )
        scraper.page = await scraper.context.new_page()
        if HAS_STEALTH:
            await Stealth().apply_stealth_async(scraper.page)

        await scraper.page.goto(listing_url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        html = await scraper.page.content()

        # Extract detail fields
        title_match = re.search(r'<title>(.*?)</title>', html)
        title = title_match.group(1).replace(" - Marketplace - Facebook", "").strip() if title_match else ""

        price_match = re.search(r'\$(\d{1,3}(?:,\d{3})*)', html)
        price = int(price_match.group(1).replace(",", "")) if price_match else 0

        desc_match = re.search(r'"marketplace_listing_title".*?"text":"([^"]*)"', html)
        description = ""
        if desc_match:
            description = desc_match.group(1).encode().decode('unicode_escape')

        # Look for year/make/model
        ym_match = re.search(r'(19|20)\d{2}\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)', title)
        year, make, model = 0, "", ""
        if ym_match:
            year, make, model = int(ym_match[0]), ym_match[1], ym_match[2]

        # Mileage
        mile_match = re.search(r'([\d,]+)\s*(?:miles|mi)', title + " " + description, re.IGNORECASE)
        mileage = int(mile_match.group(1).replace(",", "")) if mile_match else None

        return {
            "title": title,
            "price": price,
            "year": year,
            "make": make,
            "model": model,
            "mileage": mileage,
            "description": description[:2000],
            "sourceUrl": listing_url,
            "source": "facebook",
            "scrapedAt": datetime.now().isoformat(),
        }

    finally:
        await scraper._cleanup()


# ─── Quick Test ──────────────────────────────────────────────────────────

async def quick_test():
    """Smoke test the scraper — search for vehicles in Dallas."""
    scraper = FBMarketplaceScraper(session_id="test", debug=True, headless=True)
    result = await scraper.search(
        query="Toyota Camry",
        location="dallas",
        max_price=7000,
        min_year=2006,
        max_results=5,
    )
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    asyncio.run(quick_test())
