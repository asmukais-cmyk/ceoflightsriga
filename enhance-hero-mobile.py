"""
CEOFLIGHTS Riga — Mobile + Tablet Hero Enhancement
Office6 portrait -> mobile hero + tablet center crop
"""

import os, sys, io, base64
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image as PILImage

# Setup
load_dotenv(Path(__file__).parent / ".env")
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)

client = genai.Client(api_key=api_key)
OUTPUT_DIR = Path(__file__).parent / "public" / "images"

def load_and_resize(filepath, max_dim=1536):
    img = PILImage.open(filepath)
    if img.mode == "RGBA":
        img = img.convert("RGB")
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    return img

# Load Office6
office6_path = Path(__file__).parent / "Office" / "Office6.JPEG"
office6_img = load_and_resize(office6_path)
print(f"Loaded: {office6_path} ({office6_img.size[0]}x{office6_img.size[1]})")

mobile_prompt = """
Keep this office photograph EXACTLY as it is - same elevated angle looking down at workstations, same blue/grey privacy dividers, same monitors, same plants, same ceiling with LED lights, same glass partitions in background.

Make ONLY these changes:
1. Remove the water bottle visible on one of the desks - replace with clean empty desk surface matching the surrounding wood
2. Remove any small clutter items (papers, small objects) from desks, leaving them clean with just monitors, keyboards, mice, headsets

Professional enhancement:
- Apply subtle cinematic color grading: warm tones, lifted shadows, clean professional feel
- Increase clarity slightly for premium interior photography
- Keep the natural warm LED office lighting

Do NOT change the composition, camera angle, layout, or any elements.
Do NOT add any new elements. The result should look like the same real photo, just professionally retouched.
"""

print("Calling Gemini API for mobile hero...")
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[mobile_prompt, office6_img],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="3:4",
            image_size="2K",
        ),
    ),
)

mobile_saved = None
for part in response.parts:
    if part.text is not None:
        print(f"Model: {part.text}")
    elif part.inline_data is not None:
        raw_data = part.inline_data.data
        if isinstance(raw_data, str):
            raw_data = base64.b64decode(raw_data)
        img = PILImage.open(io.BytesIO(raw_data))
        
        # Save mobile hero
        img.save(str(OUTPUT_DIR / "hero-mobile.jpg"), "JPEG", quality=92, optimize=True)
        img.save(str(OUTPUT_DIR / "hero-mobile.webp"), "WEBP", quality=88, method=6)
        print(f"Saved mobile: {img.size[0]}x{img.size[1]}")
        mobile_saved = img

if not mobile_saved:
    print("FAILED - no image returned")
    sys.exit(1)

# Create tablet crop (4:3 from top-center of portrait)
w, h = mobile_saved.size
crop_h = int(w * 3 / 4)
top_offset = int(h * 0.15)
if top_offset + crop_h > h:
    top_offset = h - crop_h

tablet_crop = mobile_saved.crop((0, top_offset, w, top_offset + crop_h))
tablet_crop.save(str(OUTPUT_DIR / "hero-tablet.jpg"), "JPEG", quality=92, optimize=True)
tablet_crop.save(str(OUTPUT_DIR / "hero-tablet.webp"), "WEBP", quality=88, method=6)
print(f"Saved tablet crop: {tablet_crop.size[0]}x{tablet_crop.size[1]}")

print("DONE - mobile + tablet heroes ready")
