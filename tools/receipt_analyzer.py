#!/usr/bin/env python3
"""
Receipt image analyzer.

Pipeline:
  1. OpenCV preprocessing  – deskew, denoise, threshold
  2. Tesseract OCR         – extract raw text
  3. Regex parser          – pull out store, date, items, totals
  4. (optional) OpenAI Vision API for higher-accuracy extraction

Usage:
  python receipt_analyzer.py receipt.jpg
  python receipt_analyzer.py receipt.jpg --use-openai
  python receipt_analyzer.py receipt.jpg --save-preprocessed debug.png --output json
"""

import argparse
import base64
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import pytesseract
from dotenv import load_dotenv

# Load env vars from the dorm-dollar .env (two levels up from tools/)
_env_path = Path(__file__).parent.parent / "artifacts" / "dorm-dollar" / ".env"
load_dotenv(_env_path)


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class ReceiptItem:
    name: str
    quantity: Optional[float]
    unit_price: Optional[float]
    total: float


@dataclass
class Receipt:
    store_name: Optional[str]
    date: Optional[str]
    items: list
    subtotal: Optional[float]
    tax: Optional[float]
    total: Optional[float]
    raw_text: str


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------

def preprocess_image(image_path: str) -> np.ndarray:
    """Return a clean, binarized, deskewed version of the receipt image."""
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot load image: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale 2x so small fonts OCR better
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

    # Non-local means denoising to remove scanner/photo grain
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    # Adaptive threshold handles uneven lighting across the receipt
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10,
    )

    return _deskew(binary)


def _deskew(img: np.ndarray) -> np.ndarray:
    """Straighten a slightly rotated receipt using minAreaRect on dark pixels."""
    dark_pixels = np.column_stack(np.where(img < 128))
    if len(dark_pixels) < 5:
        return img

    angle = cv2.minAreaRect(dark_pixels)[-1]
    if angle < -45:
        angle += 90
    if abs(angle) < 0.5:
        return img

    h, w = img.shape
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderValue=255)


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

def extract_text(img: np.ndarray) -> str:
    """Run Tesseract on the preprocessed image and return raw text."""
    # oem 3 = LSTM, psm 6 = single uniform block of text
    return pytesseract.image_to_string(img, config="--oem 3 --psm 6")


# ---------------------------------------------------------------------------
# Receipt parser
# ---------------------------------------------------------------------------

_SKIP_KEYWORDS = {
    "total", "subtotal", "sub total", "sub-total",
    "tax", "hst", "gst", "vat", "pst",
    "change", "cash", "visa", "mastercard", "debit", "credit",
    "tip", "gratuity", "balance due", "amount due", "thank you",
}

_PRICE_RE = re.compile(r"^(.+?)\s+\$?([\d,]+\.\d{2})\s*$")
_QTY_RE   = re.compile(r"^(\d+(?:\.\d+)?)\s*[xX@]\s*(.+?)\s+\$?([\d,]+\.\d{2})\s*$")
_DATE_RE  = re.compile(
    r"\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}"
    r"|\w+\.?\s+\d{1,2},?\s*\d{4})\b"
)


def parse_receipt(raw_text: str) -> Receipt:
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

    return Receipt(
        store_name=_store_name(lines),
        date=_date(raw_text),
        items=_items(lines),
        subtotal=_labeled_amount(raw_text, r"sub[\s\-]?total"),
        tax=_labeled_amount(raw_text, r"\btax\b|\bhst\b|\bgst\b|\bvat\b|\bpst\b"),
        total=_labeled_amount(raw_text, r"\btotal\b"),
        raw_text=raw_text,
    )


def _store_name(lines: list) -> Optional[str]:
    # First non-trivial line that doesn't look like a phone number or date
    for line in lines[:6]:
        if (
            len(line) >= 3
            and not re.search(r"\d{3}[-.\s]\d{3,4}", line)   # phone
            and not _DATE_RE.search(line)
            and not re.fullmatch(r"[\d\s\-\(\)]+", line)      # pure digits
        ):
            return line
    return None


def _date(text: str) -> Optional[str]:
    m = _DATE_RE.search(text)
    return m.group(1) if m else None


def _items(lines: list) -> list:
    items = []
    for line in lines:
        if any(kw in line.lower() for kw in _SKIP_KEYWORDS):
            continue

        m = _QTY_RE.match(line)
        if m:
            items.append(ReceiptItem(
                name=m.group(2).strip(),
                quantity=float(m.group(1)),
                unit_price=None,
                total=float(m.group(3).replace(",", "")),
            ))
            continue

        m = _PRICE_RE.match(line)
        if m:
            items.append(ReceiptItem(
                name=m.group(1).strip(),
                quantity=None,
                unit_price=None,
                total=float(m.group(2).replace(",", "")),
            ))

    return items


def _labeled_amount(text: str, label_re: str) -> Optional[float]:
    m = re.search(rf"(?i){label_re}\s*[:\-]?\s*\$?([\d,]+\.\d{{2}})", text)
    return float(m.group(1).replace(",", "")) if m else None


# ---------------------------------------------------------------------------
# OpenAI Vision (optional high-accuracy path)
# ---------------------------------------------------------------------------

def analyze_with_openai(image_path: str, api_key: str, base_url: str) -> dict:
    """Send receipt image to GPT-4o Vision and return structured JSON."""
    from openai import OpenAI

    with open(image_path, "rb") as f:
        b64_data = base64.b64encode(f.read()).decode()

    ext = Path(image_path).suffix.lower().lstrip(".")
    mime = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png",  "webp": "image/webp",
    }.get(ext, "image/jpeg")

    client = OpenAI(api_key=api_key, base_url=base_url)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Parse this receipt and return ONLY a JSON object — no markdown, "
                            "no explanation — with these fields:\n"
                            "  store_name: string | null\n"
                            "  date: string | null\n"
                            "  items: Array<{ name: string, quantity: number | null, "
                            "unit_price: number | null, total: number }>\n"
                            "  subtotal: number | null\n"
                            "  tax: number | null\n"
                            "  total: number | null"
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64_data}"},
                    },
                ],
            }
        ],
        max_tokens=1024,
    )

    raw = response.choices[0].message.content.strip()
    # Strip accidental markdown fences GPT sometimes adds despite instructions
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.DOTALL).strip()
    return json.loads(raw)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Analyze a receipt image with OCR and extract structured data."
    )
    parser.add_argument("image", help="Path to receipt image (JPG, PNG, WEBP)")
    parser.add_argument(
        "--use-openai", action="store_true",
        help="Use OpenAI GPT-4o Vision instead of local Tesseract OCR",
    )
    parser.add_argument(
        "--save-preprocessed", metavar="PATH",
        help="Write the OpenCV-processed image to this path for debugging",
    )
    parser.add_argument(
        "--output", "-o", choices=["pretty", "json"], default="pretty",
        help="Output format: pretty-printed (default) or compact JSON",
    )
    args = parser.parse_args()

    if not Path(args.image).exists():
        print(f"Error: image not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    api_key  = os.getenv("AI_INTEGRATIONS_OPENAI_API_KEY")
    base_url = os.getenv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.openai.com/v1")

    if args.use_openai:
        if not api_key:
            print(
                "Error: AI_INTEGRATIONS_OPENAI_API_KEY not set. "
                f"Check {_env_path}",
                file=sys.stderr,
            )
            sys.exit(1)
        print("Sending image to OpenAI Vision API...", file=sys.stderr)
        result = analyze_with_openai(args.image, api_key, base_url)
    else:
        print("Preprocessing with OpenCV...", file=sys.stderr)
        processed = preprocess_image(args.image)

        if args.save_preprocessed:
            cv2.imwrite(args.save_preprocessed, processed)
            print(f"Preprocessed image saved → {args.save_preprocessed}", file=sys.stderr)

        print("Running Tesseract OCR...", file=sys.stderr)
        raw_text = extract_text(processed)

        print("Parsing receipt...", file=sys.stderr)
        receipt = parse_receipt(raw_text)
        result = asdict(receipt)

    output = json.dumps(result, indent=2) if args.output == "pretty" else json.dumps(result)
    print(output)


if __name__ == "__main__":
    main()
