"""Enhance office photos using Gemini Image Generation API.
Uses real office photos as reference to create enhanced, web-optimized versions
with better lighting, composition and a premium feel.
"""
import io, sys, base64, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image as PILImage
from dotenv import load_dotenv
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDedI69B67bLiEK_UHIHRt-CZbew9Vyyp8")
OFFICE_DIR = Path(r"C:\ANTIGRAVITY\CF Riga Video\Office")
OUT = Path(__file__).parent / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)

client = genai.Client(api_key=API_KEY)

def load_ref(filepath, max_dim=1024):
    img = PILImage.open(filepath)
    # Auto-rotate based on EXIF
    from PIL import ImageOps
    img = ImageOps.exif_transpose(img)
    if img.mode == "RGBA":
        img = img.convert("RGB")
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    return img

def enhance_image(name, prompt, ref_images, width, height, aspect="16:9"):
    print(f"\n  Enhancing {name}...")
    contents = [prompt]
    for rp in ref_images:
        print(f"    + ref: {rp.name}")
        contents.append(load_ref(rp))

    for attempt in range(3):
        try:
            print(f"    Attempt {attempt+1}/3...")
            response = client.models.generate_content(
                model="gemini-3.1-flash-image-preview",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect,
                        image_size="2K",
                    ),
                ),
            )
            for part in response.parts:
                if part.inline_data is not None:
                    raw = part.inline_data.data
                    if isinstance(raw, str):
                        raw = base64.b64decode(raw)
                    img = PILImage.open(io.BytesIO(raw))
                    print(f"    Raw: {img.size[0]}x{img.size[1]}")
                    
                    # Resize to target
                    img = img.resize((width, height), PILImage.LANCZOS)
                    
                    # Save as WebP + JPEG
                    webp_out = OUT / f"{name}.webp"
                    jpg_out = OUT / f"{name}.jpg"
                    img.save(str(webp_out), "WEBP", quality=85)
                    img.save(str(jpg_out), "JPEG", quality=88)
                    
                    wkb = webp_out.stat().st_size / 1024
                    jkb = jpg_out.stat().st_size / 1024
                    print(f"    ✅ WebP: {wkb:.0f}KB  |  JPEG: {jkb:.0f}KB")
                    return True
            print("    No image returned")
        except Exception as e:
            print(f"    Error: {str(e)[:200]}")
            if attempt < 2:
                wait = 8 * (attempt + 1)
                print(f"    Waiting {wait}s...")
                time.sleep(wait)
    return False


if __name__ == "__main__":
    print("=" * 60)
    print("  Enhancing office photos for landing page")
    print("=" * 60)

    # 1. Hero-width office shot — enhance the wide office view
    enhance_image("office-wide", (
        "Enhance this real office photo to look like a professional corporate "
        "photography shoot. Improve the lighting to be warm and inviting with "
        "natural golden-hour quality. Increase clarity and sharpness. Keep every "
        "detail authentic — the blue-grey acoustic dividers, wooden desks, monitors, "
        "glass partitions, world timezone clocks. Make it look like it belongs on "
        "a Fortune 500 careers page. No text, no overlays, no people. "
        "Professional real estate photography quality, shot on Sony A7R IV."
    ), ref_images=[
        OFFICE_DIR / "Office1.jpeg",
        OFFICE_DIR / "Office9.JPEG",
    ], width=1920, height=900, aspect="16:9")

    # 2. Office workstations — cubicle area from above
    enhance_image("office-workstations", (
        "Enhance this real office photo to look like premium corporate photography. "
        "Show the modern workstation cubicles with blue-grey fabric dividers, wooden "
        "desks, monitors, and ergonomic chairs. Improve lighting — warm, inviting "
        "ambient light from overhead LED strips. The space should feel professional, "
        "modern, and ready for work. Keep all authentic details. "
        "No text, no overlays, no people. Shot on wide angle lens, real estate quality."
    ), ref_images=[
        OFFICE_DIR / "Office6.JPEG",
        OFFICE_DIR / "Office3.jpeg",
    ], width=1920, height=900, aspect="16:9")

    # 3. Office floor + lounge combined — duo strip images
    enhance_image("office-floor", (
        "Enhance this office floor photograph. Show the full modern office space with "
        "blue acoustic cubicle dividers, wooden desks, monitors, glass partition walls, "
        "and green plants. Improve lighting to warm, inviting golden tones. Keep "
        "everything authentic. Professional corporate photography quality. "
        "No text, no people, no overlays."
    ), ref_images=[
        OFFICE_DIR / "Office3.jpeg",
    ], width=1200, height=800, aspect="3:2")

    enhance_image("office-lounge", (
        "Enhance this office break room / lounge area photo. Show the red/coral "
        "comfortable couches, wooden coffee table with flowers, skylights in ceiling. "
        "Improve lighting to feel warm and cozy. Keep all authentic details. "
        "The space should feel inviting and comfortable — a place you'd want to take "
        "a break in. Professional interior photography quality. "
        "No text, no people, no overlays."
    ), ref_images=[
        OFFICE_DIR / "Office5.JPEG",
    ], width=1200, height=800, aspect="3:2")

    # 4. Team training — enhance the group selfie
    enhance_image("team-training", (
        "Enhance this real team group photo to look like professional corporate "
        "photography. Improve the lighting, reduce noise, increase sharpness and "
        "clarity. The team is sitting around tables in a training/meeting room. "
        "Keep every person exactly as they are — do not change faces, expressions, "
        "or positions. Just improve overall photo quality, color grading, and "
        "professional appearance. Natural skin tones, warm lighting."
    ), ref_images=[
        OFFICE_DIR / "New Trainees.jpeg",
    ], width=1200, height=800, aspect="3:2")

    print(f"\n{'=' * 60}")
    print("  Done! Enhanced images saved to public/images/")
    print(f"{'=' * 60}")
