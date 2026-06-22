"""
Professional office photo enhancement pipeline.
Enhances brightness, contrast, color balance, and sharpness to look
like a professional photographer's output.
"""

from PIL import Image, ImageEnhance, ImageFilter
import os

INPUT_DIR = r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\Office"
OUTPUT_DIR = r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\public\images"

# Best office photos selected for carousel
PHOTOS = {
    # filename: (output_basename, target_width, target_height, crop_box_or_none)
    "Office2.jpeg": {
        "out": "office-wide",
        "w": 1600, "h": 900,
        "crop": None,  # Full panoramic
        "brightness": 1.12,
        "contrast": 1.08,
        "color": 1.10,
        "sharpness": 1.15,
    },
    "Office5.JPEG": {
        "out": "office-lounge",
        "w": 1600, "h": 900,
        "crop": None,  # Beautiful lounge angle
        "brightness": 1.10,
        "contrast": 1.06,
        "color": 1.12,
        "sharpness": 1.12,
    },
    "Office6.JPEG": {
        "out": "office-floor",
        "w": 1600, "h": 900,
        "crop": None,  # Elevated view of stations
        "brightness": 1.08,
        "contrast": 1.05,
        "color": 1.08,
        "sharpness": 1.15,
    },
    "Office9.JPEG": {
        "out": "world-clocks",
        "w": 1600, "h": 900,
        "crop": None,  # Clean clocks shot
        "brightness": 1.08,
        "contrast": 1.06,
        "color": 1.05,
        "sharpness": 1.10,
    },
    "Office3.jpeg": {
        "out": "office-workstations",
        "w": 1600, "h": 900,
        "crop": None,  # Close-up of calling stations
        "brightness": 1.10,
        "contrast": 1.08,
        "color": 1.08,
        "sharpness": 1.18,
    },
    "Office1.jpeg": {
        "out": "office-detail",
        "w": 1600, "h": 900,
        "crop": None,  # Glass wall + clocks detail
        "brightness": 1.10,
        "contrast": 1.06,
        "color": 1.08,
        "sharpness": 1.12,
    },
}


def center_crop(img, target_w, target_h):
    """Crop image to target aspect ratio from center."""
    img_w, img_h = img.size
    target_ratio = target_w / target_h
    img_ratio = img_w / img_h

    if img_ratio > target_ratio:
        # Wider than target - crop width
        new_w = int(img_h * target_ratio)
        left = (img_w - new_w) // 2
        return img.crop((left, 0, left + new_w, img_h))
    else:
        # Taller than target - crop height
        new_h = int(img_w / target_ratio)
        top = (img_h - new_h) // 2
        return img.crop((0, top, img_w, top + new_h))


def enhance_photo(img, settings):
    """Apply professional-grade photo enhancement."""
    # Brightness
    img = ImageEnhance.Brightness(img).enhance(settings["brightness"])
    # Contrast
    img = ImageEnhance.Contrast(img).enhance(settings["contrast"])
    # Color saturation
    img = ImageEnhance.Color(img).enhance(settings["color"])
    # Sharpness
    img = ImageEnhance.Sharpness(img).enhance(settings["sharpness"])
    return img


def process_photo(filename, settings):
    """Full processing pipeline for one photo."""
    input_path = os.path.join(INPUT_DIR, filename)
    print(f"Processing {filename}...")

    img = Image.open(input_path)
    img = img.convert("RGB")

    # Auto-rotate based on EXIF
    from PIL import ExifTags
    try:
        exif = img._getexif()
        if exif:
            for tag, value in exif.items():
                if ExifTags.TAGS.get(tag) == "Orientation":
                    if value == 3:
                        img = img.rotate(180, expand=True)
                    elif value == 6:
                        img = img.rotate(270, expand=True)
                    elif value == 8:
                        img = img.rotate(90, expand=True)
    except Exception:
        pass

    # Center crop to 16:9
    img = center_crop(img, settings["w"], settings["h"])

    # Resize to target dimensions
    img = img.resize((settings["w"], settings["h"]), Image.LANCZOS)

    # Apply enhancement
    img = enhance_photo(img, settings)

    # Save as optimized JPG and WebP
    out_base = settings["out"]
    jpg_path = os.path.join(OUTPUT_DIR, f"{out_base}.jpg")
    webp_path = os.path.join(OUTPUT_DIR, f"{out_base}.webp")

    img.save(jpg_path, "JPEG", quality=88, optimize=True)
    img.save(webp_path, "WEBP", quality=85, method=6)

    jpg_size = os.path.getsize(jpg_path) / 1024
    webp_size = os.path.getsize(webp_path) / 1024
    print(f"  -> {out_base}.jpg ({jpg_size:.0f}KB) / .webp ({webp_size:.0f}KB)")


if __name__ == "__main__":
    for filename, settings in PHOTOS.items():
        process_photo(filename, settings)
    print("\nDone! All images enhanced and saved.")
