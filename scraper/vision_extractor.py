#!/usr/bin/env python3
"""
Vision AI Vehicle Data Extractor
=================================
Captures a screenshot of a FB Marketplace listing page and uses
OpenRouter's free tier (auto-routes vision-capable models) to
extract all 35+ VehicleListing fields.

OpenRouter free: openrouter/free — auto-cycles available free vision models
Groq (fallback): llama-4-scout-17b (vision), llama-3.3-70b-versatile (text)
"""

import os
import json
import asyncio
import base64
from datetime import datetime
from typing import Optional, Dict, Any


# ─── Full 38-Field Extraction Prompt ─────────────────────────────────────

EXTRACTION_PROMPT = """You are a 30-year veteran master vehicle assessor performing a pre-purchase inspection via vision AI.

═══════════════════════════════════════════
CRITICAL: MAKE-SPECIFIC PATTERN FAILURES
═══════════════════════════════════════════
Before analyzing this listing, identify the make and model. Cross-reference against these known catastrophic failures:
- NISSAN: CVT transmission (judder/whine = $3-5K repair). VQ timing chain rattle.
- FORD: PowerShift DCT (Focus/Fiesta 2012-2016 = avoid). 5.4L Triton cam phasers. EcoBoost timing chain.
- TOYOTA: 2AZ-FE 2.4L oil consumption (Camry 2007-2011). Tacoma frame rust.
- HONDA: V6 auto trans failure (Accord/Odyssey 2000-2006). 1.5T oil dilution (Civic/CR-V 2016-2018).
- HYUNDAI/KIA: Theta II engine rod bearing failure (2011-2019 = recall). Nu engine oil consumption.
- CHEVY/GM: AFM lifter collapse (5.3L V8 2007+). 3.6L V6 timing chain. Equinox 2.4L oil consumption.
- BMW: N63 valve stem seals. N20 timing chain guides. Electric water pump failure. Cooling system plastics.
- SUBARU: EJ25 head gasket (pre-2010). FA/FB oil consumption. CVT valve body failure.
- CHRYSLER/DODGE/JEEP: TIPM electrical failures. Pentastar 3.6L cylinder head (2011-2013). Ram exhaust manifold bolts.
- VW/AUDI: 2.0T TSI timing chain tensioner. DSG mechatronic unit. Carbon buildup on intake valves.

If the vehicle matches any pattern, flag it with severity and estimated repair cost.

═══════════════════════════════════════════
INSPECTION TERMINOLOGY — USE THESE EXACT TERMS:
═══════════════════════════════════════════
- Paint: orange peel, clear coat failure, crows feet, fish eyes, blend line, tape line
- Body: Panel gap variance (>2mm = suspect), crease vs dent, rail ripple, strut tower mushrooming
- Rust: Surface rust, scale rust, perforation rust, structural rust (= instant fail)
- Frame: Pinch weld deformation, kinked core support, wrinkled floor pans, diamond condition
- Interior: Bolster collapse, seat twist, flood indicators (silt in spare tire well, seat rail rust)
- Mechanical: Rod knock, valve tap, timing chain rattle, milkshake oil, chocolate milk coolant
- Tires: Cupping, feathering, camber wear, dry rot, sidewall bulge (blowout risk)

Analyze this Facebook Marketplace vehicle listing screenshot. Return a JSON object with every detail visible on the page. Use empty string "" for any field you cannot determine from the screenshot.

{
  "title": "",
  "make": "",
  "model": "",
  "year": 0,
  "trim": "",
  "price": 0,
  "mileage": 0,
  "vin": "",
  "location": "",
  "postedDate": "",
  "titleStatus": "",
  "description": "",
  "bodyStyle": "",
  "transmission": "",
  "fuelType": "",
  "drivetrain": "",
  "engine": "",
  "cylinders": 0,
  "exteriorColor": "",
  "interiorColor": "",
  "seats": 0,
  "mpg": "",
  "condition": "",
  "conditionExterior": "",
  "conditionInterior": "",
  "conditionMechanical": "",
  "safetyRating": "",
  "numOwners": 0,
  "paidOff": false,
  "sellerName": "",
  "sellerRedFlags": "",
  "sellerQuotes": ""
}

CRITICAL: Return ONLY the JSON object. No markdown, no code fences, no explanation text before or after. Every key must be present. Empty unknown fields as "" (string) or 0 (number) or false (boolean)."""


async def extract_with_openrouter_vision(
    screenshot_base64: str,
    listing_url: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Send screenshot to OpenRouter's free tier which auto-routes to available
    free vision-capable models.

    Args:
        screenshot_base64: Base64-encoded PNG screenshot
        listing_url: The FB listing URL (for logging)
        api_key: OpenRouter API key
    """
    if not api_key:
        api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        print("[VISION] No OPENROUTER_API_KEY available — skipping OpenRouter vision", flush=True)
        return {}

    return await _call_openrouter_api(EXTRACTION_PROMPT, screenshot_base64, api_key)


async def extract_with_groq_vision(
    screenshot_base64: str,
    listing_url: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Send screenshot to Groq's Llama 4 Scout 17B vision model on LPUs.

    Args:
        screenshot_base64: Base64-encoded PNG screenshot
        listing_url: The FB listing URL (for logging)
        api_key: Groq API key

    Returns:
        Dict with all extracted fields (camelCase for veracar frontend compatibility)
    """
    if not api_key:
        api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        print("[VISION] No GROQ_API_KEY available — skipping vision extraction", flush=True)
        return {}

    return await _call_groq_api(EXTRACTION_PROMPT, screenshot_base64, api_key, "meta-llama/llama-4-scout-17b-16e-instruct")


async def enrich_with_text_model(
    year: int,
    make: str,
    model: str,
    trim: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Enrich listing with known vehicle specs using OpenRouter free tier (preferred)
    or Groq's free text model as fallback.
    Falls back to empty dict on any failure — this is purely additive enrichment.
    """
    if not year or not make or not model:
        return {}

    prompt = f"""You are a vehicle specifications database. Given a year/make/model/trim, return the standard factory specifications as JSON. Only include fields you are confident about. Use empty string for unknown fields.

Vehicle: {year} {make} {model} {trim}

Return ONLY a JSON object:
{{
  "drivetrain": "FWD, RWD, AWD, or 4WD",
  "engine": "e.g. 2.4L I4, 3.3L V6",
  "cylinders": 4,
  "mpg": "e.g. 22 city / 29 highway",
  "seats": 5,
  "fuelType": "Gasoline, Diesel, Hybrid, etc.",
  "bodyStyle": "sedan, suv, truck, etc."
}}

CRITICAL: Return ONLY valid JSON. No markdown, no explanation."""

    # Use Groq text model for enrichment
    groq_key = api_key or os.environ.get("GROQ_API_KEY", "")
    if groq_key:
        try:
            result = await _call_groq_api(prompt, "", groq_key, "llama-3.3-70b-versatile")
            spec_fields = {"drivetrain", "engine", "cylinders", "mpg", "seats", "fuelType", "bodyStyle"}
            return {k: v for k, v in result.items() if k in spec_fields and v}
        except Exception as e:
            print(f"[VISION] Groq text enrichment error (non-fatal): {e}", flush=True)

    return {}


# ─── OpenRouter API caller ─────────────────────────────────────────────

async def _call_openrouter_api(
    prompt: str,
    image_base64: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """Call OpenRouter API with openrouter/free model for vision extraction."""
    try:
        import aiohttp

        model_id = "openrouter/free"
        print(f"[VISION] Calling OpenRouter {model_id} (vision mode)...", flush=True)

        messages = [{"role": "user", "content": []}]
        if image_base64:
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_base64}"}
            })
        messages[0]["content"].append({"type": "text", "text": prompt})

        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 4096,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://www.veracar.co",
            "X-Title": "Vehicle Analyzer Pro",
        }

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"[VISION] OpenRouter API error {resp.status}: {error_text[:300]}", flush=True)
                    return {}

                result = await resp.json()

        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        actual_model = result.get("model", "unknown")

        if not content:
            print("[VISION] Empty response from OpenRouter", flush=True)
            return {}

        # Parse JSON — strip any markdown code fences
        content = content.strip()
        if content.startswith("```"):
            if "\n" in content:
                content = content.split("\n", 1)[1]
            else:
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        try:
            extracted = json.loads(content)
            count = len([k for k, v in extracted.items() if v and v != "" and v != 0])
            print(f"[VISION] OpenRouter vision: {count} populated fields extracted (model: {actual_model})", flush=True)
            return extracted
        except json.JSONDecodeError as e:
            print(f"[VISION] JSON parse error (vision): {e}", flush=True)
            print(f"[VISION] Raw (first 300): {content[:300]}", flush=True)
            return {}

    except asyncio.TimeoutError:
        print("[VISION] OpenRouter API timeout after 60s (vision)", flush=True)
        return {}
    except Exception as e:
        print(f"[VISION] OpenRouter extraction failed (vision): {e}", flush=True)
        return {}


async def _call_openrouter_text(
    prompt: str,
    api_key: str = "",
) -> Dict[str, Any]:
    """Call OpenRouter API with openrouter/free for text-only enrichment."""
    try:
        import aiohttp

        print(f"[VISION] Calling OpenRouter openrouter/free (text enrichment)...", flush=True)

        payload = {
            "model": "openrouter/free",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 1024,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://www.veracar.co",
            "X-Title": "Vehicle Analyzer Pro",
        }

        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"[VISION] OpenRouter text enrichment error {resp.status}: {error_text[:200]}", flush=True)
                    return {}

                result = await resp.json()

        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not content:
            return {}

        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]

        return json.loads(content)

    except Exception as e:
        print(f"[VISION] OpenRouter text enrichment error: {e}", flush=True)
        return {}


# ─── Groq API caller (legacy fallback) ─────────────────────────────────

async def _call_groq_api(
    prompt: str,
    image_base64: str = "",
    api_key: str = "",
    model_id: str = "meta-llama/llama-4-scout-17b-16e-instruct",
) -> Dict[str, Any]:
    """Call Groq API for vision/text extraction."""
    try:
        import aiohttp

        print(f"[VISION] Calling Groq {model_id}...", flush=True)

        messages = [{"role": "user", "content": []}]
        if image_base64:
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_base64}"}
            })
        messages[0]["content"].append({"type": "text", "text": prompt})

        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 4096,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"[VISION] Groq API error {resp.status}: {error_text[:300]}", flush=True)
                    return {}

                result = await resp.json()

        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not content:
            print("[VISION] Empty response from Groq", flush=True)
            return {}

        # Parse JSON — strip any markdown code fences
        content = content.strip()
        if content.startswith("```"):
            if "\n" in content:
                content = content.split("\n", 1)[1]
            else:
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        try:
            extracted = json.loads(content)
            count = len([k for k, v in extracted.items() if v and v != "" and v != 0])
            print(f"[VISION] {model_id}: {count} populated fields extracted", flush=True)
            return extracted
        except json.JSONDecodeError as e:
            print(f"[VISION] JSON parse error ({model_id}): {e}", flush=True)
            print(f"[VISION] Raw (first 300): {content[:300]}", flush=True)
            return {}

    except asyncio.TimeoutError:
        print(f"[VISION] Groq API timeout after 60s ({model_id})", flush=True)
        return {}
    except Exception as e:
        print(f"[VISION] Extraction failed ({model_id}): {e}", flush=True)
        return {}


async def capture_screenshot(page) -> str:
    """
    Capture a full-page screenshot of the current page as base64-encoded PNG.

    Args:
        page: Playwright page object

    Returns:
        Base64-encoded PNG string
    """
    try:
        # Full-page screenshot captures everything
        screenshot_bytes = await page.screenshot(full_page=True, type="png")
        return base64.b64encode(screenshot_bytes).decode("utf-8")
    except Exception as e:
        print(f"[VISION] Screenshot capture failed: {e}", flush=True)
        # Fallback: viewport-only screenshot
        try:
            screenshot_bytes = await page.screenshot(type="png")
            return base64.b64encode(screenshot_bytes).decode("utf-8")
        except Exception as e2:
            print(f"[VISION] Viewport screenshot also failed: {e2}", flush=True)
            return ""


def merge_extraction(
    basic: Dict[str, Any],
    vision: Dict[str, Any],
    is_enrichment: bool = False,
) -> Dict[str, Any]:
    """
    Merge basic meta-tag extraction with AI vision/extraction data.

    Normal mode (is_enrichment=False):
      Priority: basic > vision. If basic has it, use basic. If empty, use vision.

    Enrichment mode (is_enrichment=True):
      Lowest priority — only fills gaps where result currently has empty/"0" values.
      Never overrides existing data. Used for text-model spec enrichment.
    """
    # Structural fields where DOM values are more reliable
    priority_basic = {
        "price", "year", "make", "model", "trim", "location",
        "title", "description", "sourceUrl", "source", "scrapedAt", "images"
    }

    merged = {}

    if is_enrichment:
        # Enrichment mode: only fill gaps, never override
        merged.update(basic)
        for key, value in vision.items():
            if value and value != 0 and value != "":
                existing = merged.get(key)
                if not existing or existing == "" or existing == 0:
                    merged[key] = value
        print(f"[VISION] Enrichment: {len(merged)} total fields after adding {len([k for k,v in vision.items() if v])} spec fields", flush=True)
    else:
        # Normal mode: vision as base, basic overrides
        if vision:
            merged.update(vision)

        for key, value in basic.items():
            if value and (value != 0 or key == "price"):
                merged[key] = value
            elif key in priority_basic and not merged.get(key):
                merged[key] = value

        # Log merge stats
        basic_count = len([k for k, v in basic.items() if v and v != "" and v != 0])
        vision_count = len([k for k, v in vision.items() if v and v != ""]) if vision else 0
        merged_count = len([k for k, v in merged.items() if v and v != "" and v != 0])
        print(f"[VISION] Merge: {basic_count} basic + {vision_count} vision = {merged_count} merged", flush=True)

    # Ensure price/year/mileage are numbers
    for num_field in ["price", "year", "mileage", "cylinders", "numOwners", "seats"]:
        if num_field in merged and merged[num_field] is not None:
            try:
                if isinstance(merged[num_field], str):
                    merged[num_field] = int(merged[num_field].replace("$", "").replace(",", "").split(".")[0])
            except (ValueError, TypeError, AttributeError):
                pass

    # Ensure boolean fields
    if "paidOff" in merged and isinstance(merged["paidOff"], str):
        merged["paidOff"] = merged["paidOff"].lower() in ("true", "yes", "1")

    return merged
