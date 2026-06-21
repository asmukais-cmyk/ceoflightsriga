"""Enhance IMG_6930 training photo: remove camera overlay/timestamp, improve quality."""
import io, sys, base64, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image as PILImage, ImageOps
from dotenv import load_dotenv
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDedI69B67bLiEK_UHIHRt-CZbew9Vyyp8")
OUT = Path(__file__).parent / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)

client = genai.Client(api_key=API_KEY)

def load_ref(filepath, max_dim=1400):
    img = PILImage.open(filepath)
    img = ImageOps.exif_transpose(img)
    if img.mode == "RGBA":
        img = img.convert("RGB")
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)
    return img


if __name__ == "__main__":
    print("=" * 60)
    print("  Enhancing IMG_6930 training photo")
    print("=" * 60)

    src_path = Path(r"C:\ANTIGRAVITY\CEOFLIGHTS Riga\Office\iCloud Photos from Agris Smukais\IMG_6930.PNG")
    ref_img = load_ref(src_path)
    print(f"  Loaded: {ref_img.size[0]}x{ref_img.size[1]}")

    prompt = (
        "Edit this security camera photo of a training session in a modern office. "
        "REMOVE the date/time stamp text '16-06-2026 Tue 18:53:39' from the top-left corner. "
        "REMOVE the 'Camera 01' text from the bottom-right corner. "
        "Clean up these areas so they blend naturally with the surrounding image. "
        "Then enhance the overall image quality: improve lighting to be warmer and brighter, "
        "reduce noise and graininess from the security camera, increase sharpness and clarity, "
        "make the colors more vibrant and natural. "
        "Keep the scene exactly as-is — the presenter at the whiteboard and team seated at tables. "
        "Do NOT change any faces, people, furniture, or the layout of the room. "
        "The result should look like a professional photograph of a training session, "
        "not a security camera still."
    )

    for attempt in range(3):
        try:
            print(f"\n  Attempt {attempt+1}/3...")
            response = client.models.generate_content(
                model="gemini-3.1-flash-image-preview",
                contents=[prompt, ref_img],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio="16:9",
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
                    print(f"  Raw output: {img.size[0]}x{img.size[1]}")

                    # Save as training-enhanced
                    img_resized = img.resize((1200, 675), PILImage.LANCZOS)

                    webp_out = OUT / "training-enhanced.webp"
                    jpg_out = OUT / "training-enhanced.jpg"
                    img_resized.save(str(webp_out), "WEBP", quality=85)
                    img_resized.save(str(jpg_out), "JPEG", quality=88)

                    wkb = webp_out.stat().st_size / 1024
                    jkb = jpg_out.stat().st_size / 1024
                    print(f"  ✅ WebP: {wkb:.0f}KB  |  JPEG: {jkb:.0f}KB")

                    # Also save a version for team-group (wider for the team section)
                    img_group = img.resize((1200, 700), PILImage.LANCZOS)
                    webp_grp = OUT / "team-group.webp"
                    jpg_grp = OUT / "team-group.jpg"
                    img_group.save(str(webp_grp), "WEBP", quality=85)
                    img_group.save(str(jpg_grp), "JPEG", quality=88)
                    print(f"  ✅ Also saved as team-group")

                    print("\n  Done!")
                    sys.exit(0)
            print("  No image returned")
        except Exception as e:
            print(f"  Error: {str(e)[:300]}")
            if attempt < 2:
                wait = 10 * (attempt + 1)
                print(f"  Waiting {wait}s...")
                time.sleep(wait)

    print("\n  ❌ All attempts failed")
