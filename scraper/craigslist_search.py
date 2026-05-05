"""
Craigslist vehicle search scraper — no Playwright needed, just HTTP + JSON-LD.
"""

import json
import re
import time
import urllib.request
import urllib.parse
from typing import Optional
from datetime import datetime, timezone


# ─── Known makes for title parsing ───────────────────────────────────────

KNOWN_MAKES = {
    "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "bmw",
    "mercedes", "mercedes-benz", "audi", "lexus", "acura", "subaru",
    "volkswagen", "vw", "hyundai", "kia", "mazda", "jeep", "dodge",
    "ram", "gmc", "cadillac", "buick", "chrysler", "tesla", "volvo",
    "land rover", "jaguar", "porsche", "infiniti", "lincoln",
    "mitsubishi", "mini", "fiat", "genesis", "scion", "saturn",
    "pontiac", "oldsmobile", "suzuki", "isuzu",
}

YEAR_PATTERN = re.compile(r'\b(19\d{2}|20[0-2]\d)\b')

# Craigslist category codes
CATEGORIES = {
    "cars_trucks": "cta",         # cars & trucks by owner
    "cars_trucks_dealer": "ctd",  # cars & trucks by dealer
    "motorcycles": "mca",
}


# ─── Search ───────────────────────────────────────────────────────────────

def search_craigslist(
    city: str = "dallas",
    query: str = "",
    min_price: int = None,
    max_price: int = None,
    min_year: int = None,
    max_year: int = None,
    max_mileage: int = None,
    category: str = "cta",
    max_results: int = 30,
) -> list[dict]:
    """Search Craigslist and return structured vehicle listings."""

    # Build URL
    base = f"https://{city}.craigslist.org/search/{category}"
    params = {}
    if query:
        params["query"] = query
    if min_price:
        params["min_price"] = str(min_price)
    if max_price:
        params["max_price"] = str(max_price)
    if min_year:
        params["min_auto_year"] = str(min_year)
    if max_year:
        params["max_auto_year"] = str(max_year)
    if max_mileage:
        params["max_auto_miles"] = str(max_mileage)
    # Owner-only
    if category == "cta":
        params["purveyor"] = "owner"

    url = base
    if params:
        url = f"{base}?{urllib.parse.urlencode(params)}"

    print(f"[CL] Fetching: {url}", flush=True)

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[CL] Fetch failed: {e}", flush=True)
        return []

    # Extract JSON-LD search results
    listings = _extract_jsonld(html)
    print(f"[CL] Found {len(listings)} listings in JSON-LD", flush=True)

    # Also extract listing URLs from HTML (not in JSON-LD)
    listing_urls = _extract_listing_urls(html, city)
    print(f"[CL] Found {len(listing_urls)} listing URLs", flush=True)

    # Parse each listing
    results = []
    for i, item in enumerate(listings[:max_results]):
        parsed = _parse_listing(item, city, url)
        if parsed:
            # Attach listing URL if available
            if i < len(listing_urls):
                parsed["source_url"] = listing_urls[i]
            results.append(parsed)

    print(f"[CL] Parsed {len(results)} valid vehicles", flush=True)
    return results


# ─── JSON-LD Extraction ───────────────────────────────────────────────────

def _extract_listing_urls(html: str, city: str) -> list[str]:
    """Extract listing URLs from the search results HTML.
    Craigslist uses full hrefs like https://dallas.craigslist.org/dal/cto/d/.../7932168835.html"""
    pattern = rf'href="(https://{re.escape(city)}\.craigslist\.org/\w+/cto/[^"]+)"'
    matches = re.findall(pattern, html)
    urls = []
    seen = set()
    for m in matches:
        if m not in seen:
            seen.add(m)
            urls.append(m)
    return urls


def _extract_jsonld(html: str) -> list[dict]:
    """Extract the ld+json search results from Craigslist HTML."""
    # Find <script type="application/ld+json" id="ld_searchpage_results">
    pattern = r'<script[^>]*id="ld_searchpage_results"[^>]*>(.*?)</script>'
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        print("[CL] No ld_searchpage_results found", flush=True)
        return []

    try:
        data = json.loads(match.group(1))
        items = data.get("itemListElement", [])
        return [i.get("item", {}) for i in items if i.get("item")]
    except json.JSONDecodeError as e:
        print(f"[CL] JSON-LD parse error: {e}", flush=True)
        return []


# ─── Listing Parser ──────────────────────────────────────────────────────

def _parse_listing(item: dict, city: str, search_url: str) -> Optional[dict]:
    """Parse a single JSON-LD listing item into vehicle fields."""
    name = item.get("name", "").strip()
    if not name:
        return None

    # Price
    offers = item.get("offers", {})
    price_str = offers.get("price", "0")
    try:
        price = int(float(price_str))
    except (ValueError, TypeError):
        price = 0

    # Location
    place = offers.get("availableAtOrFrom", {})
    address = place.get("address", {})
    location_city = address.get("addressLocality", "")
    location_state = address.get("addressRegion", "")
    location = f"{location_city}, {location_state}" if location_city else city.title()

    # Coordinates
    geo = place.get("geo", {})
    lat = geo.get("latitude")
    lng = geo.get("longitude")

    # Images
    images = item.get("image", [])
    if isinstance(images, str):
        images = [images]

    # Description (short, from JSON-LD)
    description = item.get("description", "").strip()

    # Year / Make / Model from title
    year, make, model = _parse_title(name)

    # Mileage — not in search results JSON-LD, would need detail page
    mileage = None

    return {
        "title": name,
        "year": year,
        "make": make,
        "model": model,
        "trim": "",
        "price": price,
        "mileage": mileage,
        "vin": "",
        "location": location,
        "latitude": lat,
        "longitude": lng,
        "source_url": "",  # JSON-LD doesn't include listing URL directly
        "source": "craigslist",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "description": description,
        "posted_date": "",
        "title_status": "",
        "images": images,
        # Specs — only available on detail pages
        "body_style": "",
        "transmission": "",
        "fuel_type": "",
        "drivetrain": "",
        "engine": "",
        "cylinders": None,
        "exterior_color": "",
        "interior_color": "",
        "seats": None,
        "mpg": "",
        # Condition
        "condition": "",
        "condition_exterior": "",
        "condition_interior": "",
        "condition_mechanical": "",
        # Extended
        "safety_rating": "",
        "num_owners": None,
        "paid_off": False,
        # Seller
        "seller_name": "",
        "seller_responsiveness": "",
        "seller_transparency": "",
        "seller_red_flags": "",
        "seller_quotes": "",
    }


# ─── Title Parsing ────────────────────────────────────────────────────────

def _parse_title(title: str) -> tuple[Optional[int], str, str]:
    """Extract year, make, model from a Craigslist listing title."""
    NON_MODEL_WORDS = {"it's","its","runs","running","good","great","drives","clean",
                       "nice","sale","ac","cold","heat","works","new","used",
                       "low","miles","mileage","k","automatic","manual",
                       "runs","drives","excellent","condition","runs","perfect"}

    year = None
    make = ""
    model_str = ""

    parts = title.strip().split()
    if not parts:
        return None, "", ""

    # Year: first token or anywhere
    ym = YEAR_PATTERN.match(parts[0])
    if ym:
        year = int(ym.group(1))
        parts = parts[1:]
    else:
        ym2 = YEAR_PATTERN.search(title)
        if ym2:
            year = int(ym2.group(1))

    def _extract_model(model_parts):
        """Extract model name from tokens after make, stopping at non-model words."""
        model_tokens = []
        for mp in model_parts:
            if mp in ("-", "·", "—"):
                break
            if mp.lower().strip(",.!-") in NON_MODEL_WORDS and len(model_tokens) >= 1:
                break
            model_tokens.append(mp)
            if len(model_tokens) >= 3:
                break
        return " ".join(model_tokens) if model_tokens else ""

    # Make — check single-word and two-word makes
    for i, word in enumerate(parts):
        word_lower = word.lower().strip(",.!-")
        if word_lower in KNOWN_MAKES:
            make = word
            model_str = _extract_model(parts[i+1:])
            return year, make, model_str

        # Two-word makes (e.g. "land rover")
        if i + 1 < len(parts):
            two_word = f"{word_lower} {parts[i+1].lower().strip(',.!-')}"
            if two_word in KNOWN_MAKES:
                make = f"{word} {parts[i+1]}"
                model_str = _extract_model(parts[i+2:])
                return year, make, model_str

    # Fallback: model is rest of title
    model_str = " ".join(parts) if parts else title
    return year, "", model_str


# ─── Standalone test ──────────────────────────────────────────────────────

if __name__ == "__main__":
    results = search_craigslist(
        city="dallas",
        query="Toyota Camry",
        max_price=7000,
        min_year=2006,
        max_results=5,
    )
    print(json.dumps(results, indent=2))
    print(f"\nTotal: {len(results)} listings")
