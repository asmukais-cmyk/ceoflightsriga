"""
CEOFLIGHTS Riga — Hero Background v2: Outpaint to wide landscape
Model: gemini-3.1-flash-image-preview

Takes Office6.JPEG (portrait 1152x1536) and extends it horizontally
to create a wide panoramic hero image that preserves the full spacious
office view instead of cropping it.
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

# Outpaint prompt — extend the image to a wide landscape while preserving full content
edit_prompt = """
This is a photograph of a modern, spacious office with blue/grey privacy dividers, wooden desks, monitors, keyboards, plants, and overhead LED lighting. The image is currently in portrait orientation.

TASK: Extend this image into a WIDE LANDSCAPE (16:9) format by naturally expanding the scene to the LEFT and RIGHT sides. The goal is to show MORE of the office space — more workstations, more of the ceiling, more of the open floor plan — making it feel even MORE spacious and impressive.

CRITICAL RULES:
1. Keep the ENTIRE original image content visible — do NOT crop or zoom into any part of it
2. The extended areas on left and right should seamlessly continue the office environment: more blue dividers, more desks with monitors, continuation of the ceiling with LED panel lights, and the glass partitions visible in the background
3. The perspective, lighting, color temperature, and style must be perfectly consistent with the original
4. Remove the water bottle visible on one of the desks — replace with clean empty desk space
5. Remove any small clutter items from desks

ENHANCEMENT:
- Apply subtle professional color grading: slightly warm tones, lifted shadows
- Increase clarity slightly for a premium commercial interior photography feel
- Keep the natural office lighting — warm LEDs, no dramatic changes

The result should look like one continuous wide-angle photograph of a spacious, modern call center office — the kind of image that makes job candidates want to work there.
"""

# Call API
print("Calling Gemini API for panoramic extension... (30-60 seconds)")
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
            
            # Save as WebP
            img.save(str(output_webp), "WEBP", quality=88, method=6)
            print(f"Saved WebP: {output_webp}")
            
            image_saved = True
        except Exception as e:
            print(f"Error processing image: {e}")
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

print("\nDone! Panoramic hero background saved.")
