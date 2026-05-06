#!/usr/bin/env python3
"""
Vision AI Vehicle Data Extractor
=================================
Captures a screenshot of a FB Marketplace listing page and uses Groq's
vision model (Llama-4-Scout-17B) to extract all 35+ VehicleListing fields.

Free tier models: llama-4-scout-17b (vision), llama-3.3-70b-versatile (text)
"""

import os
import json
import asyncio
import base64
from datetime import datetime
from typing import Optional, Dict, Any


# ─── Full 38-Field Extraction Prompt ─────────────────────────────────────

EXTRACTION_PROMPT = """Analyze this Facebook Marketplace vehicle listing screenshot. Return a JSON object with every detail visible on the page. Use empty string "" for any field you cannot determine from the screenshot.

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


async def extract_with_groq_vision(
    screenshot_base64: str,
    listing_url: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Send a FB Marketplace listing screenshot to Groq's vision model
    for comprehensive 38-field extraction.
    
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
    
    return await _call_groq_api(EXTRACTION_PROMPT, screenshot_base64, api_key, "vision")


async def enrich_with_text_model(
    year: int,
    make: str,
    model: str,
    trim: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Enrich listing with known vehicle specs using Groq's free text model.
    Falls back to empty dict on any failure — this is purely additive enrichment.
    """
    if not year or not make or not model:
        return {}
    if not api_key:
        api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
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
    
    try:
        result = await _call_groq_api(prompt, "", api_key, "text")
        # Filter to only spec fields
        spec_fields = {"drivetrain", "engine", "cylinders", "mpg", "seats", "fuelType", "bodyStyle"}
        return {k: v for k, v in result.items() if k in spec_fields and v}
    except Exception as e:
        print(f"[VISION] Text enrichment error (non-fatal): {e}", flush=True)
        return {}


async def _call_groq_api(
    prompt: str,
    image_base64: str = "",
    api_key: str = "",
    mode: str = "vision",
) -> Dict[str, Any]:
    """Unified Groq API caller for both vision and text models."""
    try:
        import aiohttp
        
        model = "meta-llama/llama-4-scout-17b-16e-instruct" if mode == "vision" else "llama-3.3-70b-versatile"
        print(f"[VISION] Calling Groq {model} ({mode} mode)...", flush=True)
        
        messages = [{"role": "user", "content": []}]
        if image_base64:
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_base64}"}
            })
        messages[0]["content"].append({"type": "text", "text": prompt})
        
        payload = {
            "model": model,
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
            print(f"[VISION] {mode} mode: {count} populated fields extracted", flush=True)
            return extracted
        except json.JSONDecodeError as e:
            print(f"[VISION] JSON parse error ({mode}): {e}", flush=True)
            print(f"[VISION] Raw (first 300): {content[:300]}", flush=True)
            return {}
    
    except asyncio.TimeoutError:
        print(f"[VISION] Groq API timeout after 60s ({mode})", flush=True)
        return {}
    except Exception as e:
        print(f"[VISION] Extraction failed ({mode}): {e}", flush=True)
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
