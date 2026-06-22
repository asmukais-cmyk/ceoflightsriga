"""
CEOFLIGHTS Riga — Responsive Hero Image Pipeline
Model: gemini-3.1-flash-image-preview

Enhances real office photos for 3 responsive hero breakpoints:
1. Desktop (>960px): Office2 panoramic landscape — enhanced
2. Tablet (641-960px): Office6 center crop 4:3 — enhanced  
3. Mobile (≤640px): Office6 full portrait — enhanced

NO outpainting. NO invented content. Real photos only.
"""

import os, sys, io, base64, time
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

def save_hero(img, basename):
    """Save as both JPG and WebP."""
    jpg_path = OUTPUT_DIR / f"{basename}.jpg"
    webp_path = OUTPUT_DIR / f"{basename}.webp"
    img.save(str(jpg_path), "JPEG", quality=92, optimize=True)
    img.save(str(webp_path), "WEBP", quality=88, method=6)
    print(f"  Saved: {jpg_path} ({img.size[0]}x{img.size[1]})")
    print(f"  Saved: {webp_path}")
    return img

def enhance_image(source_img, prompt, aspect_ratio):
    """Call Gemini API to enhance an image."""
    response = client.models.generate_content(
        model="gemini-3.1-flash-image-preview",
        contents=[prompt, source_img],
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size="2K",
            ),
        ),
    )
    
    for part in response.parts:
        if part.text is not None:
            print(f"  Model: {part.text}")
        elif part.inline_data is not None:
            raw_data = part.inline_data.data
            if isinstance(raw_data, str):
                raw_data = base64.b64decode(raw_data)
            return PILImage.open(io.BytesIO(raw_data))
    
    return None


# ═══════════════════════════════════════════════════════════════
# 1. DESKTOP HERO — Office2 panoramic landscape
# ═══════════════════════════════════════════════════════════════
print("=" * 60)
print("1/2  DESKTOP HERO — Office2 panoramic landscape")
print("=" * 60)

office2_path = Path(__file__).parent / "Office" / "Office2.jpeg"
office2_img = load_and_resize(office2_path)
print(f"Loaded: {office2_path} ({office2_img.size[0]}x{office2_img.size[1]})")

desktop_prompt = """
Keep this office photograph EXACTLY as it is — same angle, same layout, same furniture, same room.
This is a wide panoramic view of a modern office with a lounge area (red sofas, coffee table) on the left and workstation partitions on the right, with world timezone clocks visible in the far background.

Make ONLY these changes:
1. Remove the trash bin / waste bin visible near the workstations
2. Clean up any small clutter items on the floor or desks

Professional enhancement:
- Apply subtle cinematic color grading: warm tones, slightly lifted shadows, clean whites
- Increase clarity and sharpness slightly for a premium commercial interior photography feel  
- Make the lighting feel natural and inviting — warm interior LED lighting
- The overall look should feel like high-end commercial real estate photography

Do NOT change the composition, camera angle, layout, furniture, or any major elements.
Do NOT add any new elements. The result should look like the same real photo, just professionally retouched.
"""

print("Calling Gemini API for desktop hero...")
desktop_result = enhance_image(office2_img, desktop_prompt, "16:9")
if desktop_result:
    save_hero(desktop_result, "hero-desktop")
    print("✓ Desktop hero saved\n")
else:
    print("✗ Failed to generate desktop hero\n")
    sys.exit(1)

# Rate limit
time.sleep(4)

# ═══════════════════════════════════════════════════════════════
# 2. MOBILE HERO — Office6 full portrait (workstation close-up)
# ═══════════════════════════════════════════════════════════════
print("=" * 60)
print("2/2  MOBILE HERO — Office6 portrait workstation view")
print("=" * 60)

office6_path = Path(__file__).parent / "Office" / "Office6.JPEG"
office6_img = load_and_resize(office6_path)
print(f"Loaded: {office6_path} ({office6_img.size[0]}x{office6_img.size[1]})")

mobile_prompt = """
Keep this office photograph EXACTLY as it is — same elevated angle looking down at workstations, same blue/grey privacy dividers, same monitors, same plants, same ceiling with LED lights, same glass partitions in background.

Make ONLY these changes:
1. Remove the water bottle visible on one of the desks — replace with clean empty desk surface matching the surrounding wood
2. Remove any small clutter items (papers, small objects) from desks, leaving them clean with just monitors, keyboards, mice, headsets

Professional enhancement:
- Apply subtle cinematic color grading: warm tones, lifted shadows, clean professional feel
- Increase clarity slightly for premium interior photography
- Keep the natural warm LED office lighting
- Match the same color grading style as the desktop hero

Do NOT change the composition, camera angle, layout, or any elements.
Do NOT add any new elements. The result should look like the same real photo, just professionally retouched.
"""

print("Calling Gemini API for mobile hero...")
mobile_result = enhance_image(office6_img, mobile_prompt, "3:4")
if mobile_result:
    mobile_saved = save_hero(mobile_result, "hero-mobile")
    print("✓ Mobile hero saved\n")
    
    # ═══════════════════════════════════════════════════════════
    # 3. TABLET HERO — Center crop from the mobile result
    # ═══════════════════════════════════════════════════════════
    print("=" * 60)
    print("BONUS  TABLET HERO — 4:3 center crop from mobile")
    print("=" * 60)
    
    w, h = mobile_saved.size
    # Target 4:3 landscape from the portrait image
    # We want the top-center region showing workstations + ceiling depth
    # For a 4:3 crop from a 3:4 image, the crop width = full width, 
    # crop height = width * 3/4
    crop_h = int(w * 3 / 4)
    # Position: start from about 15% from top to capture workstations + ceiling
    top_offset = int(h * 0.15)
    if top_offset + crop_h > h:
        top_offset = h - crop_h
    
    tablet_crop = mobile_saved.crop((0, top_offset, w, top_offset + crop_h))
    save_hero(tablet_crop, "hero-tablet")
    print("✓ Tablet hero saved\n")
else:
    print("✗ Failed to generate mobile hero\n")
    sys.exit(1)

print("\n" + "=" * 60)
print("ALL DONE — 3 responsive hero images ready:")
print(f"  Desktop: {OUTPUT_DIR / 'hero-desktop.jpg'}")
print(f"  Tablet:  {OUTPUT_DIR / 'hero-tablet.jpg'}")
print(f"  Mobile:  {OUTPUT_DIR / 'hero-mobile.jpg'}")
print("=" * 60)
