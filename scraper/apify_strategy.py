"""
Apify crawlerbros/facebook-marketplace-scraper integration.
Maps Apify output → veracar.co VehicleListing (all 35+ fields).
"""

import os
import re
import json
import time
import asyncio
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Optional

from fb_marketplace import VehicleListing


# ─── Apify API ───────────────────────────────────────────────────────────

APIFY_TOKEN = os.environ.get("APIFY_API_TOKEN", "")
APIFY_ACTOR = "crawlerbros~facebook-marketplace-scraper"
APIFY_BASE = "https://api.apify.com/v2"


def _call_apify(endpoint: str, method: str = "GET", body: dict = None) -> dict:
    """Call Apify API v2."""
    sep = "&" if "?" in endpoint else "?"
    url = f"{APIFY_BASE}/{endpoint}{sep}token={APIFY_TOKEN}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": str(e), "body": e.read().decode()[:500]}


def _start_run(start_urls: list[str], results_per_url: int = 20,
               include_details: bool = True) -> str:
    """Start an Apify actor run. Returns run ID."""
    body = {
        "startUrls": [{"url": u} for u in start_urls],
        "resultsLimit": results_per_url,
        "includeListingDetails": include_details,
        "proxyConfiguration": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        }
    }
    resp = _call_apify(f"acts/{APIFY_ACTOR}/runs", "POST", body)
    return resp.get("data", {}).get("id", "")


def _wait_for_run(run_id: str, timeout_sec: int = 120) -> dict:
    """Poll until run completes. Returns final status."""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        resp = _call_apify(f"acts/{APIFY_ACTOR}/runs/{run_id}")
        status = resp.get("data", {}).get("status", "")
        if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            return resp.get("data", {})
        time.sleep(4)
    return {"status": "TIMEOUT"}


def _get_dataset(dataset_id: str) -> list[dict]:
    """Fetch all items from a dataset."""
    resp = _call_apify(f"datasets/{dataset_id}/items?format=json")
    return resp if isinstance(resp, list) else resp.get("data", [])


# ─── Year / Make / Model / Mileage Parsers ────────────────────────────────

# Common makes for disambiguation
KNOWN_MAKES = {
    "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "bmw",
    "mercedes", "mercedes-benz", "audi", "lexus", "acura", "subaru",
    "volkswagen", "vw", "hyundai", "kia", "mazda", "jeep", "dodge",
    "ram", "gmc", "cadillac", "buick", "chrysler", "tesla", "volvo",
    "land rover", "jaguar", "porsche", "infiniti", "lincoln",
    "mitsubishi", "mini", "fiat", "genesis", "scion", "saturn",
    "pontiac", "oldsmobile", "suzuki", "isuzu",
}

MILEAGE_PATTERN = re.compile(r'(\d{1,3}[,.]?\d{0,3})\s*[kK]\s*miles?')
YEAR_PATTERN = re.compile(r'\b(19\d{2}|20[0-2]\d)\b')


def _parse_year_make_model(title: str) -> tuple[Optional[int], str, str]:
    """Extract year, make, model from a listing title like '2012 Toyota Camry LE'."""
    year = None
    make = ""
    model = ""

    parts = title.strip().split()
    if not parts:
        return None, "", ""

    # Extract year from first token
    ym = YEAR_PATTERN.match(parts[0])
    if ym:
        year = int(ym.group(1))
        parts = parts[1:]
    else:
        # Try anywhere in title
        ym2 = YEAR_PATTERN.search(title)
        if ym2:
            year = int(ym2.group(1))

    # Extract make
    for i, word in enumerate(parts):
        word_lower = word.lower().strip(",.!-")
        if word_lower in KNOWN_MAKES:
            make = word
            model_parts = parts[i+1:]
            model = " ".join(model_parts) if model_parts else ""
            break
        # Check two-word makes
        if i + 1 < len(parts):
            two_word = f"{word_lower} {parts[i+1].lower().strip(',.!-')}"
            if two_word in KNOWN_MAKES:
                make = f"{word} {parts[i+1]}"
                model_parts = parts[i+2:]
                model = " ".join(model_parts) if model_parts else ""
                break

    if not make:
        # Fallback: use entire title as model, make unknown
        model = " ".join(parts) if parts else title
        make = ""

    return year, make, model


def _parse_mileage(subtitles: list, description: str = "") -> Optional[int]:
    """Extract mileage from subtitle flags or description."""
    # Check subtitle flags (e.g., "143K miles")
    for sub in subtitles:
        text = sub.get("subtitle", "") if isinstance(sub, dict) else str(sub)
        m = MILEAGE_PATTERN.search(text)
        if m:
            return int(m.group(1).replace(",", "").replace(".", "")) * 1000

    # Check description
    if description:
        m = MILEAGE_PATTERN.search(description)
        if m:
            return int(m.group(1).replace(",", "").replace(".", "")) * 1000

    return None


# ─── Main Mapping ─────────────────────────────────────────────────────────

def map_apify_to_vehicle(item: dict, search_url: str = "") -> VehicleListing:
    """Convert a single Apify result item to VehicleListing.
    Maps ALL 38 fields — fills what's available, leaves blanks where not."""

    scraped_at = datetime.now(timezone.utc).isoformat()

    # ── Core Identity ──
    title = item.get("marketplace_listing_title", "") or item.get("custom_title", "")
    source_url = item.get("listingUrl", "")
    location_city = item.get("location", {}).get("reverse_geocode", {}).get("city", "")
    location_state = item.get("location", {}).get("reverse_geocode", {}).get("state", "")
    location = f"{location_city}, {location_state}" if location_city else ""

    # Price: Apify returns amount (dollars), amount_with_offset_in_currency (cents)
    price_obj = item.get("listing_price", {})
    price_str = price_obj.get("amount", "0")
    try:
        price = int(float(price_str))
    except (ValueError, TypeError):
        price = 0

    # Year / Make / Model — prefer Apify vehicle_ fields, fall back to title parsing
    year = None
    make = item.get("vehicle_make_display_name", "")
    model = item.get("vehicle_model_display_name", "")

    if not make or not model:
        year, make, model = _parse_year_make_model(title)
    else:
        # Still extract year from title or other fields
        ym = YEAR_PATTERN.search(title)
        year = int(ym.group(1)) if ym else None

    # Mileage — prefer vehicle_odometer_data
    odometer = item.get("vehicle_odometer_data", {}) or {}
    subtitles = item.get("custom_sub_titles_with_rendering_flags", [])
    if odometer:
        try:
            mileage = int(odometer.get("value", 0)) if isinstance(odometer, dict) else None
        except (ValueError, TypeError):
            mileage = _parse_mileage(subtitles)
    else:
        mileage = _parse_mileage(subtitles)

    # Images
    images = []
    photo = item.get("primary_listing_photo", {})
    if photo and photo.get("image", {}).get("uri"):
        images.append(photo["image"]["uri"])

    # ── Listing Context ──
    raw_desc = item.get("redacted_description", "")
    description = ""
    if isinstance(raw_desc, dict):
        description = raw_desc.get("text", "")
    elif isinstance(raw_desc, str):
        description = raw_desc

    # Posted date — Apify gives creation_time as Unix timestamp when detail page is scraped
    creation_time = item.get("creation_time")
    if creation_time:
        try:
            posted_date = datetime.fromtimestamp(creation_time, tz=timezone.utc).isoformat()
        except (TypeError, ValueError):
            posted_date = ""
    else:
        posted_date = ""

    # Title status — FB doesn't expose directly; check description
    title_status = ""
    if description:
        desc_lower = description.lower()
        if "salvage" in desc_lower or "rebuilt" in desc_lower:
            title_status = "salvage" if "salvage" in desc_lower else "rebuilt"
        elif "clean title" in desc_lower:
            title_status = "clean"
        elif "lien" in desc_lower:
            title_status = "lien"

    # ── Specifications (from vehicle_* fields when available) ──
    attrs = item.get("attribute_data", {}) or {}
    body_style = (item.get("vehicle_specifications", {}) or {}).get("body_style", "") or attrs.get("body_style", "") or attrs.get("vehicle_type", "")
    transmission = item.get("vehicle_transmission_type", "") or attrs.get("transmission", "")
    fuel_type = item.get("vehicle_fuel_type", "") or attrs.get("fuel_type", "")
    drivetrain = attrs.get("drivetrain", "") or attrs.get("drive", "")
    engine = attrs.get("engine", "")
    cylinders = None
    cyl_str = attrs.get("cylinders", "") or attrs.get("engine_cylinders", "")
    if cyl_str:
        try:
            cylinders = int(re.search(r'\d+', str(cyl_str)).group())
        except (ValueError, AttributeError):
            pass
    exterior_color = (item.get("vehicle_exterior_color", "") or attrs.get("exterior_color", "")
                      or attrs.get("color", "") or item.get("exterior_color", ""))
    interior_color = item.get("vehicle_interior_color", "") or attrs.get("interior_color", "")
    seats = None
    seats_str = attrs.get("seats", "") or attrs.get("num_seats", "")
    if seats_str:
        try:
            seats = int(re.search(r'\d+', str(seats_str)).group())
        except (ValueError, AttributeError):
            pass
    mpg = attrs.get("mpg", "") or attrs.get("fuel_economy", "")

    # Vehicle features as string
    vehicle_features_list = item.get("vehicle_features", [])
    if vehicle_features_list:
        features_str = ", ".join(str(f) for f in vehicle_features_list[:10])
        if not body_style and "sedan" in features_str.lower():
            body_style = "sedan"
        # Store features somewhere useful — append to description if empty
        if not description and features_str:
            description = f"Features: {features_str}"

    # Also try to extract specs from description
    if description and not body_style:
        desc_lower = description.lower()
        for style in ["sedan", "suv", "coupe", "truck", "hatchback", "wagon",
                       "convertible", "minivan", "crossover"]:
            if style in desc_lower:
                body_style = style
                break
    if description and not transmission:
        desc_lower = description.lower()
        if "automatic" in desc_lower:
            transmission = "automatic"
        elif "manual" in desc_lower:
            transmission = "manual"

    # ── Condition ──
    condition = (item.get("vehicle_condition", "") or attrs.get("condition", "")
                or item.get("condition", "") or "")
    condition_exterior = attrs.get("condition_exterior", "")
    condition_interior = attrs.get("condition_interior", "")
    condition_mechanical = attrs.get("condition_mechanical", "")

    # ── Extended FB Marketplace ──
    safety_rating = attrs.get("safety_rating", "")
    num_owners = None
    owners_str = attrs.get("num_owners", "") or attrs.get("owners", "")
    if owners_str:
        try:
            num_owners = int(re.search(r'\d+', str(owners_str)).group())
        except (ValueError, AttributeError):
            pass
    paid_off = attrs.get("paid_off", False) or False

    # ── Seller Intel ──
    seller_obj = item.get("marketplace_listing_seller", {}) or {}
    seller_name = seller_obj.get("name", "") or item.get("vehicle_seller_type", "")
    seller_badges = item.get("commerce_badges_info", {}) or {}

    # Use share_uri if listingUrl is missing
    source_url = source_url or item.get("share_uri", "")

    # Delivery types
    delivery = item.get("delivery_types", [])

    # Status flags
    is_sold = item.get("is_sold", False)
    is_pending = item.get("is_pending", False)
    is_live = item.get("is_live", True)

    return VehicleListing(
        # Core Identity
        title=title,
        year=year,
        make=make,
        model=model,
        trim="",
        price=price,
        mileage=mileage,
        vin=attrs.get("vin", ""),
        location=location,
        source_url=source_url,
        source="facebook",
        scraped_at=scraped_at,

        # Listing Context
        description=description,
        posted_date=posted_date,
        title_status=title_status,
        images=images,

        # Specifications
        body_style=body_style,
        transmission=transmission,
        fuel_type=fuel_type,
        drivetrain=drivetrain,
        engine=engine,
        cylinders=cylinders,
        exterior_color=exterior_color,
        interior_color=interior_color,
        seats=seats,
        mpg=mpg,

        # Condition
        condition=condition,
        condition_exterior=condition_exterior,
        condition_interior=condition_interior,
        condition_mechanical=condition_mechanical,

        # Extended FB
        safety_rating=safety_rating,
        num_owners=num_owners,
        paid_off=paid_off,

        # Seller Intel
        seller_name=seller_name,
        seller_responsiveness=seller_badges.get("response_rate", ""),
        seller_transparency=seller_badges.get("transparency", ""),
        seller_red_flags="",
        seller_quotes="",
    )


# ─── Strategy Runner ──────────────────────────────────────────────────────

async def apify_search(search_url: str, max_results: int = 20) -> list[VehicleListing]:
    """Run an Apify search and return mapped VehicleListings."""
    if not APIFY_TOKEN:
        print("[APIFY] No APIFY_API_TOKEN set — skipping", flush=True)
        return []

    print(f"[APIFY] Searching: {search_url}", flush=True)
    run_id = _start_run([search_url], max_results, include_details=True)
    if not run_id:
        print("[APIFY] Failed to start run", flush=True)
        return []

    print(f"[APIFY] Run started: {run_id}", flush=True)
    status = _wait_for_run(run_id, timeout_sec=180)
    if status.get("status") != "SUCCEEDED":
        print(f"[APIFY] Run failed: {status.get('status')}", flush=True)
        return []

    dataset_id = status.get("defaultDatasetId", "")
    if not dataset_id:
        print("[APIFY] No dataset ID", flush=True)
        return []

    items = _get_dataset(dataset_id)
    print(f"[APIFY] Got {len(items)} raw items", flush=True)

    listings = []
    for item in items:
        try:
            vl = map_apify_to_vehicle(item, search_url)
            listings.append(vl)
        except Exception as e:
            print(f"[APIFY] Mapping error: {e}", flush=True)

    return listings
