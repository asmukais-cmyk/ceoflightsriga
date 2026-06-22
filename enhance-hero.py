"""
CEOFLIGHTS Riga — Hero Background Image Enhancement
Model: gemini-3.1-flash-image-preview

Takes Office6.JPEG and enhances it:
- Remove the water bottle from the desk
- Professional color grading
- Cinematic, clean interior photography aesthetic
- Outputs hero-ready image in JPG + WebP
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

def load_and_resize(filepath, max_dim=1536):
    """Load an image, resize if needed, return PIL Image."""
    img = PILImage.open(filepath)
    if img.mode == "RGBA":
        img = img.convert("RGB")
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    return img

# Load source image
source_path = Path(__file__).parent / "Office" / "Office6.JPEG"
print(f"Loading source: {source_path}")
source_img = load_and_resize(source_path)
print(f"Source size: {source_img.size[0]}x{source_img.size[1]}")

# Edit prompt - remove water bottle, enhance professionally
edit_prompt = """
Keep this office photograph EXACTLY as it is — same angle, same workstations, same blue privacy dividers, same monitors, same plants, same lighting fixtures, same ceiling.

Make these specific changes:
1. REMOVE the water bottle that is visible on one of the desks. Replace it with clean, empty desk space that matches the surrounding wood desk surface naturally.
2. Remove any small clutter items (papers, small objects) from the desks, leaving them clean and organized with just monitors, keyboards, mice, and headsets.

Additionally, enhance the image professionally:
- Apply cinematic color grading: slightly warm tones, lifted shadows, subtle blue-teal shadows
- Increase clarity and sharpness slightly for a premium editorial feel
- Ensure the lighting feels natural and inviting — warm LED office lighting
- The overall look should feel like high-end commercial interior photography for a recruitment campaign

Do NOT change the composition, camera angle, layout, or any major elements. The result should look like the same photo, just professionally retouched.
"""

# Call API
print("Calling Gemini API for enhancement... (30-60 seconds)")
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[edit_prompt, source_img],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="2K",
        ),
    ),
)

# Process response
output_dir = Path(__file__).parent / "public" / "images"
output_jpg = output_dir / "hero-enhanced.jpg"
output_webp = output_dir / "hero-enhanced.webp"

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
            
            # Save as high-quality JPG
            img.save(str(output_jpg), "JPEG", quality=92, optimize=True)
            print(f"Saved JPG: {output_jpg} ({img.size[0]}x{img.size[1]})")
            
            # Save as WebP for web performance
            img.save(str(output_webp), "WEBP", quality=88, method=6)
            print(f"Saved WebP: {output_webp}")
            
            image_saved = True
        except Exception as e:
            print(f"Error processing image: {e}")
            # Fallback: write raw bytes
            with open(str(output_jpg), "wb") as f:
                d = part.inline_data.data
                f.write(base64.b64decode(d) if isinstance(d, str) else d)
            image_saved = True

if not image_saved:
    print("No image returned in response")
    if hasattr(response, 'candidates') and response.candidates:
        for c in response.candidates:
            print(f"  Finish reason: {getattr(c, 'finish_reason', 'N/A')}")
    sys.exit(1)

print("\nDone! Hero background enhanced successfully.")
