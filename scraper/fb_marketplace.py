
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
    STRATEGY_APIFY = "apify_remote"
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

    # ── Strategy 4: Apify Remote (residential proxies, no login needed) ───

    async def _strategy_apify(self, search_url: str) -> list[VehicleListing]:
        """Use Apify crawlerbros actor — residential proxies, anti-detection built-in."""
        self._log("Strategy 4: Apify Remote")
        try:
            from apify_strategy import apify_search
            max_results = getattr(self, '_max_results', 20)
            return await apify_search(search_url, max_results)
        except ImportError as e:
            self._log(f"Apify strategy not available: {e}")
            return []
        except Exception as e:
            self._log(f"Apify strategy failed: {e}")
            return []

    # ── Navigation & Extraction ──────────────────────────────────────────

    async def _attempt_fb_login(self, page: Page) -> bool:
        """Try to log into Facebook using FB_EMAIL/FB_PASSWORD env vars.
        Returns True if login succeeded, False otherwise."""
        fb_email = os.environ.get("FB_EMAIL", "")
        fb_password = os.environ.get("FB_PASSWORD", "")

        if not fb_email or not fb_password:
            print("[FB-SCRAPER] No FB_EMAIL/FB_PASSWORD set — cannot log in", flush=True)
            return False

        print("[FB-SCRAPER] Attempting Facebook login...", flush=True)
        try:
            # Use mbasic.facebook.com — far less aggressive anti-bot
            await page.goto("https://mbasic.facebook.com/login", wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)

            # mbasic has simple form: email + pass on same page
            email_input = await page.wait_for_selector(
                'input[name="email"]', timeout=10000
            )
            if not email_input:
                print("[FB-SCRAPER] Could not find email input", flush=True)
                return False
            await email_input.click()
            await asyncio.sleep(0.3)
            await email_input.fill(fb_email)
            print("[FB-SCRAPER] Email filled (mbasic)", flush=True)

            password_input = await page.wait_for_selector(
                'input[name="pass"]', timeout=5000
            )
            if password_input:
                await password_input.click()
                await asyncio.sleep(0.3)
                await password_input.fill(fb_password)
                print("[FB-SCRAPER] Password filled (mbasic)", flush=True)
            
            # mbasic — just press Enter after filling both fields
            if password_input:
                await password_input.press("Enter")
                print("[FB-SCRAPER] Submitted (Enter, mbasic)", flush=True)
            else:
                await email_input.press("Enter")
                print("[FB-SCRAPER] Submitted (Enter on email, mbasic)", flush=True)
            
            await asyncio.sleep(5)

            current_url = page.url
            print(f"[FB-SCRAPER] After login: {current_url[:120]}", flush=True)

            # Check for 2FA
            if "checkpoint" in current_url.lower() or "two_factor" in current_url.lower() or "two_step" in current_url.lower():
                print("[FB-SCRAPER] ⚠️ 2FA/checkpoint detected", flush=True)
                print(f"[FB-SCRAPER] URL: {current_url[:200]}", flush=True)
                
                # Take screenshot to understand what FB is asking for
                try:
                    ss_dir = os.path.expanduser("~/.fb_scraper_sessions")
                    os.makedirs(ss_dir, exist_ok=True)
                    ss_path = os.path.join(ss_dir, "2fa_page.png")
                    await self.page.screenshot(path=ss_path, full_page=True)
                    print(f"[FB-SCRAPER] 2FA screenshot saved: {ss_path}", flush=True)
                except Exception as e:
                    print(f"[FB-SCRAPER] Screenshot failed: {e}", flush=True)
                
                # Try to dismiss "save browser" dialogs — not actual 2FA codes
                try:
                    not_now_selectors = [
                        'button:has-text("Not Now")',
                        'button:has-text("Skip")',
                        'a:has-text("Not Now")',
                        'a:has-text("Skip")',
                        'div[role="button"]:has-text("Not Now")',
                        'div[role="button"]:has-text("Skip")',
                    ]
                    for sel in not_now_selectors:
                        try:
                            dismiss = await self.page.wait_for_selector(sel, timeout=2000)
                            if dismiss:
                                await dismiss.click()
                                print(f"[FB-SCRAPER] Dismissed dialog: {sel}", flush=True)
                                await asyncio.sleep(3)
                                current_url = self.page.url
                                print(f"[FB-SCRAPER] After dismiss: {current_url[:120]}", flush=True)
                                if "two_step" not in current_url.lower() and "checkpoint" not in current_url.lower():
                                    print("[FB-SCRAPER] Login successful after dismiss!", flush=True)
                                    cookies = await self.context.cookies()
                                    self.sessions.save_cookies(self.session_id, cookies)
                                    state = {"has_cookies": True, "last_url": current_url, "logged_in": True}
                                    self.sessions.save_state(self.session_id, state)
                                    return True
                                break
                        except:
                            continue
                except Exception as e:
                    print(f"[FB-SCRAPER] Dismiss attempt error: {e}", flush=True)
                
                # Save cookies anyway and return
                cookies = await self.context.cookies()
                self.sessions.save_cookies(self.session_id, cookies)
                return False

            # Check if login succeeded
            if "login" not in current_url.lower() and "checkpoint" not in current_url.lower() and "two_step" not in current_url.lower():
                print("[FB-SCRAPER] Login successful!", flush=True)
                cookies = await self.context.cookies()
                self.sessions.save_cookies(self.session_id, cookies)
                state = {"has_cookies": True, "last_url": current_url, "logged_in": True}
                self.sessions.save_state(self.session_id, state)
                return True

            print(f"[FB-SCRAPER] Still on login page — login may have failed", flush=True)
            return False

        except Exception as e:
            print(f"[FB-SCRAPER] Login error: {e}", flush=True)
            return False

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
                self._log("Hit login/checkpoint wall — attempting login...")
                # Attempt FB login with credentials
                logged_in = await self._attempt_fb_login(self.page)
                if logged_in:
                    self._log("Login succeeded, navigating to search URL...")
                    # Now navigate to the actual marketplace URL
                    await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    await asyncio.sleep(2)
                else:
                    # Save whatever cookies we have and give up
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

        # Save max_results for strategies that need it
        self._max_results = max_results

        # Strategy cascade
        strategies = [prefer_strategy] if prefer_strategy else [
            self.STRATEGY_STEALTH,
            self.STRATEGY_FRESH,
            self.STRATEGY_SCRAPLING,
            self.STRATEGY_APIFY,
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
                elif strategy == self.STRATEGY_APIFY:
                    listings = await self._strategy_apify(search_url)
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
    """Scrape a single FB Marketplace listing.
    
    Strategy (all free — no Apify credit needed):
    1. Meta-tag extraction — FB exposes og:title/desc/image + JSON price blobs WITHOUT login
    2. Fall back to Playwright with cookies if meta tags insufficient
    """
    import urllib.parse as urlparse
    
    # Clean the URL
    cleaned_url = listing_url
    item_match = re.search(r'(facebook\.com/marketplace/item/\d+)', listing_url)
    if item_match:
        cleaned_url = f"https://www.{item_match.group(1)}/"
    print(f"[DETAIL] Cleaned URL: {cleaned_url[:80]}...", flush=True)
    
    html = ""
    page_title = ""
    
    # ── Strategy 1: Meta-tag extraction (no login needed!) ──
    try:
        scraper = FBMarketplaceScraper(session_id=session_id, debug=True)
        scraper.playwright = await async_playwright().start()
        scraper.browser = await scraper.playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled",
                  "--disable-dev-shm-usage", "--disable-gpu"]
        )
        scraper.context = await scraper.browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )
        
        # Load session cookies if available (fresh FB auth cookies from user)
        cookies = scraper.sessions.load_cookies(session_id)
        if cookies:
            await scraper.context.add_cookies(cookies)
            print(f"[DETAIL] Loaded {len(cookies)} session cookies", flush=True)
        else:
            print("[DETAIL] No session cookies found", flush=True)
        
        scraper.page = await scraper.context.new_page()
        
        # Apply stealth to avoid headless detection
        if HAS_STEALTH:
            try:
                await stealth_apply(scraper.page)
            except Exception:
                pass
        
        # Fast load — content is in meta tags, no JS needed
        await scraper.page.goto(cleaned_url, wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(2)
        
        html = await scraper.page.content()
        page_title = await scraper.page.title()
        page_url = scraper.page.url
        
        # Extract Open Graph meta tags (available WITHOUT login!)
        og_title = await scraper.page.evaluate(
            "() => document.querySelector('meta[property=\"og:title\"]')?.content || ''"
        )
        og_desc = await scraper.page.evaluate(
            "() => document.querySelector('meta[property=\"og:description\"]')?.content || ''"
        )
        og_image = await scraper.page.evaluate(
            "() => document.querySelector('meta[property=\"og:image\"]')?.content || ''"
        )
        meta_desc = await scraper.page.evaluate(
            "() => document.querySelector('meta[name=\"description\"]')?.content || ''"
        )
        
        # Extract price from JSON data blobs (also available before login!)
        price = 0
        condition = ""
        json_location = ""
        try:
            price_data = await scraper.page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script[type="application/json"]');
                    for (const s of scripts) {
                        try {
                            const d = JSON.parse(s.textContent);
                            const str = JSON.stringify(d);
                            // Find formatted_price near this listing
                            const idx = str.indexOf('"formatted_price"');
                            if (idx >= 0) {
                                const chunk = str.substring(idx, idx + 200);
                                const priceMatch = chunk.match(/"text":"\\$([\\d,]+)"/);
                                if (priceMatch) return {
                                    price: parseInt(priceMatch[1].replace(/,/g, '')),
                                    raw: chunk
                                };
                            }
                        } catch(e) {}
                    }
                    return null;
                }
            """)
            if price_data:
                price = price_data.get("price", 0)
                # Also try to get condition
                cond_match = re.search(r'"condition":"(\w+)"', price_data.get("raw", ""))
                if cond_match:
                    condition = cond_match.group(1)
                # And location
                loc_match = re.search(r'"reverse_geocode":\{"city":"([^"]+)","state":"([^"]+)"', price_data.get("raw", ""))
                if loc_match:
                    json_location = f"{loc_match.group(1)}, {loc_match.group(2)}"
        except Exception as e:
            print(f"[DETAIL] Price extraction from JSON failed: {e}", flush=True)
        
        # Fallback: extract price from HTML regex
        if not price:
            price_match = re.search(r'\$(\d{1,3}(?:,\d{3})*)', html)
            if price_match:
                price = int(price_match.group(1).replace(",", ""))
        
        title = og_title or page_title.replace(" | Facebook Marketplace | Facebook", "").strip()
        # Clean common prefixes and suffixes
        title = re.sub(r'^Marketplace\s*[-–—]\s*', '', title)
        title = re.sub(r'^\(\d+\)\s*Marketplace\s*[-–—]\s*', '', title)  # "(1) Marketplace - "
        title = re.sub(r'\|?\s*Facebook\s*$', '', title).strip()
        description = og_desc or meta_desc or ""
        images = [og_image] if og_image else []
        
        # Parse year/make/model from title "2017 Kia Sorento · LX Sport Utility 4D"
        year, make, model, trim = 0, "", "", ""
        parts = title.split("·")
        main_part = parts[0].strip() if parts else title
        
        ym_match = re.search(r'((?:19|20)\d{2})\s+([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)?)\s+([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)?)', main_part)
        if ym_match:
            year = int(ym_match.group(1))  # full 4-digit year
            make = ym_match.group(2).strip()
            model = ym_match.group(3).strip()
        
        if len(parts) > 1:
            trim = parts[1].strip()
            # Clean trim — strip Facebook branding
            trim = re.sub(r'\s*\|\s*Facebook\s*$', '', trim).strip()
        
        # Mileage from description
        mile_match = re.search(r'([\d,]+)\s*(?:miles|mi|k miles)', description, re.IGNORECASE)
        mileage = int(mile_match.group(1).replace(",", "")) if mile_match else None
        
        if mile_match and "k" in mile_match.group(0).lower():
            mileage = mileage * 1000 if mileage else None
        
        # Location from title "Dallas, Texas"
        location = json_location
        if not location and " - " in page_title:
            loc_part = page_title.split(" - ")[-1].replace(" | Facebook Marketplace | Facebook", "").strip()
            if loc_part and loc_part != page_title:
                location = loc_part
        
        # Also try extracting from og:title which might have location
        if not location and " · " in title:
            loc_match = re.search(r'in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)', title, re.IGNORECASE)
            if loc_match:
                location = loc_match.group(1)
        
        # Extra images from JSON blobs
        if not images or len(images) < 3:
            try:
                more_images = await scraper.page.evaluate("""
                    () => {
                        const scripts = document.querySelectorAll('script[type="application/json"]');
                        const urls = [];
                        for (const s of scripts) {
                            try {
                                const str = JSON.stringify(JSON.parse(s.textContent));
                                const matches = str.match(/"image":\\{"uri":"([^"]+)"/g) || [];
                                for (const m of matches) {
                                    const url = m.match(/uri":"([^"]+)"/)?.[1];
                                    if (url && !urls.includes(url)) urls.push(url);
                                }
                            } catch(e) {}
                        }
                        return urls.slice(0, 10);
                    }
                """)
                if more_images:
                    images.extend(more_images)
                    images = list(set(images))[:10]
            except Exception:
                pass
        
        print(f"[DETAIL] Extracted — title='{title[:60] if title else 'EMPTY'}', price=${price}, make='{make}', model='{model}'", flush=True)
        
        if title and (price or make):
            # ── Build basic result from meta-tags ──
            basic_result = {
                "title": title,
                "price": price,
                "year": year,
                "make": make,
                "model": model,
                "trim": trim,
                "mileage": mileage,
                "vin": "",
                "location": location,
                "description": description[:2000],
                "images": images[:10],
                "condition": condition,
                "sourceUrl": cleaned_url,
                "source": "facebook",
                "scrapedAt": datetime.now().isoformat(),
            }
            
            # ── AI Vision Extraction (MUST happen BEFORE _cleanup closes browser) ──
            try:
                from vision_extractor import (
                    extract_with_groq_vision, capture_screenshot, merge_extraction,
                    enrich_with_text_model
                )
                
                print("[DETAIL] Capturing screenshot for AI vision extraction...", flush=True)
                screenshot_b64 = await capture_screenshot(scraper.page)
                
                if screenshot_b64:
                    print(f"[DETAIL] Screenshot captured ({len(screenshot_b64)} base64 chars). Sending to Groq...", flush=True)
                    vision_result = await extract_with_groq_vision(screenshot_b64, cleaned_url)
                    if vision_result:
                        basic_result = merge_extraction(basic_result, vision_result)
                        print(f"[DETAIL] Vision extraction complete. {len(vision_result)} vision fields merged.", flush=True)
                    else:
                        print("[DETAIL] Vision extraction returned empty.", flush=True)
                else:
                    print("[DETAIL] Screenshot capture failed.", flush=True)
                
                # ── Text enrichment: fill known specs from year/make/model ──
                enrich_year = basic_result.get("year")
                enrich_make = basic_result.get("make", "")
                enrich_model = basic_result.get("model", "")
                enrich_trim = basic_result.get("trim", "")
                if enrich_year and enrich_make and enrich_model:
                    print(f"[DETAIL] Enriching specs for {enrich_year} {enrich_make} {enrich_model}...", flush=True)
                    spec_result = await enrich_with_text_model(enrich_year, enrich_make, enrich_model, enrich_trim)
                    if spec_result:
                        basic_result = merge_extraction(basic_result, spec_result, is_enrichment=True)
                        print(f"[DETAIL] Text enrichment added {len(spec_result)} spec fields.", flush=True)
            except ImportError:
                print("[DETAIL] vision_extractor module not found — skipping AI vision.", flush=True)
            except Exception as e:
                print(f"[DETAIL] Vision extraction error (non-fatal): {e}", flush=True)
            
            await scraper._cleanup()
            return basic_result
        
    except Exception as e:
        print(f"[DETAIL] Meta-tag strategy failed: {e}", flush=True)
        try:
            await scraper._cleanup()
        except Exception:
            pass
    
    raise Exception(f"Could not extract listing data — Facebook may require login for this listing")


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
