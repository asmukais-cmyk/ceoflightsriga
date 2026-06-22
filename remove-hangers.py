"""
Remove cloth hangers from Office/New Trainees.jpeg — v2
Model: gemini-3.1-flash-image-preview (image editing)
Fixes: orientation preservation, face preservation
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
# Strip EXIF rotation to ensure correct orientation
from PIL import ImageOps
source_img = ImageOps.exif_transpose(source_img)
if source_img.mode == "RGBA":
    source_img = source_img.convert("RGB")

original_size = source_img.size
print(f"Original size (after EXIF correction): {original_size[0]}x{original_size[1]}")

# Resize for API (max 1536 for editing)
max_dim = 1536
if max(source_img.size) > max_dim:
    source_img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    print(f"Resized to: {source_img.size[0]}x{source_img.size[1]}")

# Edit prompt — extremely specific
edit_prompt = """This is a LANDSCAPE (horizontal) orientation group selfie photo taken in a training room.

CRITICAL: Maintain the EXACT same orientation (landscape/horizontal), the EXACT same perspective, the EXACT same people with their EXACT same faces, expressions, poses, clothing, and positions. Do NOT rotate the image. Do NOT change any person's appearance.

The ONLY change to make: On the wall behind the group of people, there is a chrome/metal clothing rack/rail with white plastic coat hangers hanging from it. Remove this clothing rack, the metal rail/bar, and ALL the white hangers. Replace that entire area with a plain, clean wall that matches the surrounding light grey wall color and texture, so the wall looks continuous and natural as if the rack was never there.

IMPORTANT: Keep EVERYTHING else pixel-perfect identical — all people, their faces, the desks, items on desks, the door, the floor, the laptop screen, the glass of water, the fire safety sign on the door, the light on the ceiling. ONLY remove the clothing rack and hangers."""

# Call API — use 4:3 to match the landscape orientation
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
            # Verify orientation is landscape
            if img.size[0] < img.size[1]:
                print(f"WARNING: Output is portrait ({img.size[0]}x{img.size[1]}), rotating...")
                img = img.rotate(90, expand=True)
            img.save(str(output_path), "JPEG", quality=95)
            image_saved = True
            print(f"Saved: {output_path} ({img.size[0]}x{img.size[1]})")
        except Exception as e:
            print(f"Error processing image: {e}")

if not image_saved:
    print("No image returned in response")
    sys.exit(1)

print(f"\nDone! Check: {output_path}")
