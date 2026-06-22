"""
Remove cloth hangers from Office/New Trainees.jpeg
Model: gemini-3.1-flash-image-preview (image editing)
"""

import os, sys, io, base64
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image as PILImage
from datetime import datetime

# Setup
load_dotenv(Path(__file__).parent / ".env")
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Fallback to CF Thumbnails .env
    load_dotenv(Path(r"C:\ANTIGRAVITY\CF Thumbnails\.env"))
    api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# Load source image
source_path = Path(__file__).parent / "Office" / "New Trainees.jpeg"
print(f"Loading: {source_path}")

source_img = PILImage.open(source_path)
if source_img.mode == "RGBA":
    source_img = source_img.convert("RGB")

original_size = source_img.size
print(f"Original size: {original_size[0]}x{original_size[1]}")

# Resize for API (max 1536 for editing)
max_dim = 1536
if max(source_img.size) > max_dim:
    source_img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    print(f"Resized to: {source_img.size[0]}x{source_img.size[1]}")

# Edit prompt — very specific about what to change and what to keep
edit_prompt = """Keep this photograph EXACTLY as it is — same people, same poses, same expressions, same lighting, same table, same items on tables, same everything.

The ONLY change: Remove the chrome/metal clothing rack and white cloth hangers visible on the wall behind the group of people. Replace that area with a plain clean wall that matches the surrounding wall color and texture (light grey/white wall). The wall should look natural and continuous as if the clothing rack was never there.

Do NOT change any person, their clothing, their position, or any other element in the image. Only remove the clothing rack and hangers."""

# Call API
print("Calling Gemini API for image editing... (30-60 seconds)")
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[edit_prompt, source_img],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="4:3",
            image_size="2K",
        ),
    ),
)

# Save output
output_path = Path(__file__).parent / "Office" / "New Trainees_no_hangers.jpeg"

if response.parts is None:
    print("WARNING: response.parts is None")
    if hasattr(response, 'candidates') and response.candidates:
        for c in response.candidates:
            print(f"  Finish reason: {getattr(c, 'finish_reason', 'N/A')}")
            if hasattr(c, 'safety_ratings') and c.safety_ratings:
                for sr in c.safety_ratings:
                    print(f"  Safety: {sr}")
    sys.exit(1)

image_saved = False
for part in response.parts:
    if part.text is not None:
        print(f"Model: {part.text}")
    elif part.inline_data is not None:
        try:
            raw_data = part.inline_data.data
            if isinstance(raw_data, str):
                raw_data = base64.b64decode(raw_data)
            img = PILImage.open(io.BytesIO(raw_data))
            # Save as JPEG to match original format
            img.save(str(output_path), "JPEG", quality=95)
            image_saved = True
            print(f"Saved: {output_path} ({img.size[0]}x{img.size[1]})")
        except Exception as e:
            print(f"Error processing image: {e}")
            # Fallback: write raw bytes
            with open(str(output_path), "wb") as f:
                d = part.inline_data.data
                f.write(base64.b64decode(d) if isinstance(d, str) else d)
            image_saved = True
            print(f"Saved (raw): {output_path}")

if not image_saved:
    print("No image returned in response")
    sys.exit(1)

print(f"\nDone! Check: {output_path}")
