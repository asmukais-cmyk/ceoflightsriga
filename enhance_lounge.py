"""
Enhance IMG_6904 (office lounge) for the slider:
- Crop off heater/radiator on left side
- Professional photographer enhancement
- Output as landscape for proper slider display
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
    print("ERROR: GEMINI_API_KEY not found")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# Load the ORIGINAL source image (IMG_6904)
source_path = Path(r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\Office\iCloud Photos from Agris Smukais\IMG_6904.JPEG")
source_img = PILImage.open(source_path)
if source_img.mode == "RGBA":
    source_img = source_img.convert("RGB")
print(f"Original size: {source_img.size}")

# Step 1: Crop off the heater from the left side
# Image is portrait ~960x1280. Heater is on the left ~15-18% of the width
w, h = source_img.size
crop_left = int(w * 0.16)  # Crop ~16% from left to cut off most of the heater
cropped = source_img.crop((crop_left, 0, w, h))
print(f"Cropped size: {cropped.size}")

# Resize for API input (max 1536)
max_dim = 1536
if max(cropped.size) > max_dim:
    cropped.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    print(f"Resized for API: {cropped.size}")

# Step 2: Enhance with Gemini - use 16:9 for landscape slider display
edit_prompt = """Enhance this office lounge photograph to professional editorial quality suitable for a premium company website.

KEEP EXACTLY: The same room, same furniture arrangement (red lounge chairs, red sofa, white lily flowers in vase on round wooden coffee table, grey carpet tiles, blue acoustic divider panels on the right side, skylights in the ceiling). Keep the same perspective and depth showing the office extending back. Do NOT add, remove, or rearrange any furniture or objects.

ENHANCE:
- Professional architectural/interior photographer quality — like a high-end coworking space or WeWork listing
- Perfect white balance: clean neutral whites on walls, no yellow or pink cast
- Rich, vibrant true red on the chairs and sofa — saturated but natural, not neon
- Sharpen all textures: fabric weave on chairs, carpet tile pattern, wood grain on coffee table, flower petal detail
- Even, balanced lighting throughout — reduce harsh shadows and dark areas
- Make the skylights look bright and inviting with natural daylight streaming in
- Subtle professional depth of field — sharp foreground furniture, slightly softer background
- Clean, modern color grading with warm undertones
- Remove any visible cables, imperfections on walls, or distracting elements

TECHNICAL: Shot on Canon EOS R5, 16-35mm f/2.8 at 24mm, natural window light supplemented with fill, f/5.6 for good depth, ISO 400, professionally post-processed in Lightroom and Photoshop. Architectural interior photography style. No text, no watermarks, no borders, no vignette."""

print("Calling Gemini API for enhancement... (30-60 seconds)")
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[edit_prompt, cropped],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="2K",
        ),
    ),
)

# Save output
output_dir = Path(r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\public\images")
timestamp = datetime.now().strftime("%H%M%S")

image_saved = False
for part in response.parts:
    if part.text is not None:
        print(f"Model: {part.text}")
    elif part.inline_data is not None:
        raw = part.inline_data.data
        if isinstance(raw, str):
            raw = base64.b64decode(raw)
        img = PILImage.open(io.BytesIO(raw))
        
        # Save as office-lounge.jpg (replacing current)
        jpg_path = output_dir / f"office-lounge-v2_{timestamp}.jpg"
        img.save(str(jpg_path), "JPEG", quality=95)
        print(f"Saved JPG: {jpg_path} ({img.size[0]}x{img.size[1]})")
        
        # Save as WebP
        webp_path = output_dir / f"office-lounge-v2_{timestamp}.webp"
        img.save(str(webp_path), "WEBP", quality=90, method=6)
        print(f"Saved WebP: {webp_path}")
        
        image_saved = True

if not image_saved:
    print("ERROR: No image returned")
    if hasattr(response, 'candidates') and response.candidates:
        for c in response.candidates:
            print(f"  Finish reason: {getattr(c, 'finish_reason', 'N/A')}")
