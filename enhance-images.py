"""
Professional office photo enhancement pipeline v2.
Unified color grading to make all images look cohesive —
as if shot by the same photographer at the same time.

Target look: Bright, clean, slightly warm white balance,
lifted shadows, gentle sharpening — modern corporate editorial style.
"""

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import os
import numpy as np

OUTPUT_DIR = r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\public\images"
OFFICE_DIR = r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\Office"
ICLOUD_DIR = os.path.join(OFFICE_DIR, "iCloud Photos from Agris Smukais")

# Target dimensions
TARGET_W = 1600
TARGET_H = 900

# Unified base grading profile — cohesive "same session" look
BASE_PROFILE = {
    "brightness": 1.12,   # Lift overall brightness
    "contrast": 1.08,     # Subtle contrast boost
    "color": 1.10,        # Slight color pop
    "sharpness": 1.15,    # Gentle sharpening
    "warmth": 0.02,       # Slight warm shift (add to R, subtract from B)
    "shadow_lift": 15,    # Lift darkest shadows (0-255 range)
}

# Per-image overrides (only for images that need deviation from base)
PHOTOS = [
    {
        "src": os.path.join(OFFICE_DIR, "Office2.jpeg"),
        "out": "slide-01-panorama",
        # Already well-lit panoramic — use base profile
    },
    {
        "src": os.path.join(ICLOUD_DIR, "IMG_6761.JPEG"),
        "out": "slide-02-floor-wide",
        "brightness": 1.15,  # Slightly darker original
    },
    {
        "src": os.path.join(OFFICE_DIR, "Office5.JPEG"),
        "out": "slide-03-lounge-close",
        "brightness": 1.10,  # Already warm
        "color": 1.08,
    },
    {
        "src": os.path.join(ICLOUD_DIR, "IMG_6904.JPEG"),
        "out": "slide-04-lounge-corridor",
        "brightness": 1.14,
    },
    {
        "src": os.path.join(OFFICE_DIR, "Office6.JPEG"),
        "out": "slide-05-stations-above",
        "brightness": 1.10,
    },
    {
        "src": os.path.join(OFFICE_DIR, "Office3.jpeg"),
        "out": "slide-06-stations-detail",
        "brightness": 1.12,
        "sharpness": 1.18,
    },
    {
        "src": os.path.join(OFFICE_DIR, "Office9.JPEG"),
        "out": "slide-07-world-clocks",
        "brightness": 1.10,
    },
    {
        "src": os.path.join(OFFICE_DIR, "Office7.JPEG"),
        "out": "slide-08-floor-spacious",
        "brightness": 1.10,
    },
    {
        "src": os.path.join(ICLOUD_DIR, "IMG_6877.JPEG"),
        "out": "slide-09-team-training",
        "brightness": 1.06,  # Already well-lit flash photo
        "contrast": 1.04,
        "color": 1.06,
        "warmth": 0.01,
    },
    {
        "src": os.path.join(OFFICE_DIR, "Office10.JPEG"),
        "out": "slide-10-plant-view",
        "brightness": 1.15,  # Darker original (shot through plants)
        "contrast": 1.10,
    },
]


def auto_orient(img):
    """Fix EXIF orientation."""
    try:
        from PIL import ExifTags
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
    return img


def center_crop_16_9(img):
    """Crop image to 16:9 from center."""
    w, h = img.size
    target_ratio = 16 / 9
    img_ratio = w / h

    if img_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        return img.crop((0, top, w, top + new_h))


def lift_shadows(img, amount):
    """Lift the darkest shadows to create a more editorial/modern look."""
    if amount <= 0:
        return img
    # Simple curves adjustment: map 0 -> amount, 255 -> 255
    lut = []
    for i in range(256):
        lut.append(int(amount + (255 - amount) * i / 255))
    return img.point(lut * 3)  # Apply to R, G, B


def apply_warmth(img, amount):
    """Apply a subtle warm color shift (more golden, less blue)."""
    if amount <= 0:
        return img
    r, g, b = img.split()
    # Warm = slight red boost + slight blue reduction
    r_shift = int(amount * 255)
    b_shift = int(amount * 255)

    r_lut = [min(255, i + r_shift) for i in range(256)]
    b_lut = [max(0, i - b_shift) for i in range(256)]
    g_lut = list(range(256))  # Green unchanged

    r = r.point(r_lut)
    b = b.point(b_lut)
    return Image.merge("RGB", (r, g, b))


def process_photo(photo_config):
    """Full processing pipeline for one photo."""
    src = photo_config["src"]
    out_name = photo_config["out"]

    # Merge base profile with per-image overrides
    profile = dict(BASE_PROFILE)
    for key in BASE_PROFILE:
        if key in photo_config:
            profile[key] = photo_config[key]

    print(f"Processing {os.path.basename(src)} -> {out_name}")

    img = Image.open(src).convert("RGB")
    img = auto_orient(img)

    # Center crop to 16:9
    img = center_crop_16_9(img)

    # Resize to target
    img = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)

    # Shadow lift (before other adjustments)
    img = lift_shadows(img, profile["shadow_lift"])

    # Warmth shift
    img = apply_warmth(img, profile["warmth"])

    # Brightness, Contrast, Color, Sharpness
    img = ImageEnhance.Brightness(img).enhance(profile["brightness"])
    img = ImageEnhance.Contrast(img).enhance(profile["contrast"])
    img = ImageEnhance.Color(img).enhance(profile["color"])
    img = ImageEnhance.Sharpness(img).enhance(profile["sharpness"])

    # Save as optimized JPG and WebP
    jpg_path = os.path.join(OUTPUT_DIR, f"{out_name}.jpg")
    webp_path = os.path.join(OUTPUT_DIR, f"{out_name}.webp")

    img.save(jpg_path, "JPEG", quality=88, optimize=True)
    img.save(webp_path, "WEBP", quality=85, method=6)

    jpg_kb = os.path.getsize(jpg_path) / 1024
    webp_kb = os.path.getsize(webp_path) / 1024
    print(f"  -> {out_name}.jpg ({jpg_kb:.0f}KB) / .webp ({webp_kb:.0f}KB)")


if __name__ == "__main__":
    # Clean up old slide images
    for f in os.listdir(OUTPUT_DIR):
        if f.startswith("office-") or f.startswith("world-") or f.startswith("slide-"):
            os.remove(os.path.join(OUTPUT_DIR, f))
            print(f"  Removed old: {f}")

    print(f"\nProcessing {len(PHOTOS)} photos with unified grading...\n")

    for photo in PHOTOS:
        process_photo(photo)

    print(f"\nDone! {len(PHOTOS)} images enhanced and saved to {OUTPUT_DIR}")
