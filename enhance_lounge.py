"""
Enhance office-lounge image:
- Crop off heater/radiator on left side
- Enhance resolution and quality
- Professional photographer feel with better color grading
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

# Load source image
source_path = Path(r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\public\images\office-lounge.jpg")
source_img = PILImage.open(source_path)
print(f"Original size: {source_img.size}")

# Step 1: Crop off the left side (heater + fire sign area) and bottom empty floor
# The heater takes roughly the left 35% of the image
w, h = source_img.size
crop_left = int(w * 0.35)  # Crop ~35% from left to fully remove heater/radiator
crop_bottom = int(h * 0.15)  # Trim some empty floor from bottom
cropped = source_img.crop((crop_left, 0, w, h - crop_bottom))
print(f"Cropped size: {cropped.size}")

# Convert for API
if cropped.mode == "RGBA":
    cropped = cropped.convert("RGB")

# Resize for API input (max 1536)
max_dim = 1536
if max(cropped.size) > max_dim:
    cropped.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    print(f"Resized for API: {cropped.size}")

# Step 2: Enhance with Gemini
edit_prompt = """Enhance this office lounge photograph to professional editorial quality.

KEEP EXACTLY: The same room, same furniture (red chairs, red sofa, flowers in vase, round wooden coffee table, grey carpet), same composition and perspective. Do NOT add or remove any furniture or objects.

ENHANCE:
- Professional photographer color grading: warm, inviting tones with slightly desaturated shadows
- Improved lighting: make it look like it was shot with professional studio lighting - soft, even illumination 
- Sharpen details on furniture textures, carpet weave, and flower petals
- Subtle depth of field effect - slightly softer background with sharp foreground
- Clean, modern interior photography feel like an Airbnb listing or architectural magazine
- Rich, true red on the chairs and sofa without oversaturation
- Neutral, balanced white walls without yellow cast
- Add subtle warm ambient light feel

TECHNICAL: Shot on Sony A7R IV, 24mm f/2.8, natural + fill lighting, Lightroom color grading, architectural interior photography style. No text, no watermarks, no borders."""

print("Calling Gemini API for enhancement... (30-60 seconds)")
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[edit_prompt, cropped],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="4:3",
            image_size="2K",
        ),
    ),
)

# Save output
output_dir = Path(r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\public\images")
timestamp = datetime.now().strftime("%H%M%S")
output_path = output_dir / f"office-lounge-enhanced_{timestamp}.jpg"

image_saved = False
for part in response.parts:
    if part.text is not None:
        print(f"Model: {part.text}")
    elif part.inline_data is not None:
        raw = part.inline_data.data
        if isinstance(raw, str):
            raw = base64.b64decode(raw)
        img = PILImage.open(io.BytesIO(raw))
        
        # Save as high-quality JPEG
        img.save(str(output_path), "JPEG", quality=95)
        print(f"Saved enhanced: {output_path} ({img.size[0]}x{img.size[1]})")
        
        # Also save as WebP for web
        webp_path = output_dir / f"office-lounge-enhanced_{timestamp}.webp"
        img.save(str(webp_path), "WEBP", quality=90, method=6)
        print(f"Saved WebP: {webp_path}")
        
        image_saved = True

if not image_saved:
    print("ERROR: No image returned")
    if hasattr(response, 'candidates') and response.candidates:
        for c in response.candidates:
            print(f"  Finish reason: {getattr(c, 'finish_reason', 'N/A')}")
