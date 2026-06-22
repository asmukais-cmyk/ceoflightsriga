"""
Reprocess world clocks image with a wider crop showing more of the room.
"""
from PIL import Image, ImageEnhance
import os

OUTPUT_DIR = r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\public\images"
SRC = r"c:\ANTIGRAVITY\CEOFLIGHTS Riga\Office\Office9.JPEG"

TARGET_W = 1600
TARGET_H = 900

def auto_orient(img):
    try:
        from PIL import ExifTags
        exif = img._getexif()
        if exif:
            for tag, value in exif.items():
                if ExifTags.TAGS.get(tag) == "Orientation":
                    if value == 3: img = img.rotate(180, expand=True)
                    elif value == 6: img = img.rotate(270, expand=True)
                    elif value == 8: img = img.rotate(90, expand=True)
    except: pass
    return img

def lift_shadows(img, amount):
    if amount <= 0: return img
    lut = [int(amount + (255 - amount) * i / 255) for i in range(256)]
    return img.point(lut * 3)

def apply_warmth(img, amount):
    if amount <= 0: return img
    r, g, b = img.split()
    shift = int(amount * 255)
    r = r.point([min(255, i + shift) for i in range(256)])
    b = b.point([max(0, i - shift) for i in range(256)])
    return Image.merge("RGB", (r, g, b))

img = Image.open(SRC).convert("RGB")
img = auto_orient(img)

w, h = img.size
print(f"Original size: {w}x{h}")

# For this portrait image, use a crop that's positioned higher
# to capture the clocks AND the glass partition AND more floor
target_ratio = TARGET_W / TARGET_H  # 16:9

# Take the full width, calculate required height for 16:9
crop_h = int(w / target_ratio)

# Position the crop starting from higher up (30% from top instead of 50%)
top = int((h - crop_h) * 0.25)  # Bias toward top to show clocks
bottom = top + crop_h

print(f"Crop: full width, y={top} to y={bottom} (h={crop_h})")

img = img.crop((0, top, w, bottom))
img = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)

# Apply same unified grading
img = lift_shadows(img, 15)
img = apply_warmth(img, 0.02)
img = ImageEnhance.Brightness(img).enhance(1.10)
img = ImageEnhance.Contrast(img).enhance(1.08)
img = ImageEnhance.Color(img).enhance(1.10)
img = ImageEnhance.Sharpness(img).enhance(1.15)

# Save
jpg_path = os.path.join(OUTPUT_DIR, "slide-07-world-clocks.jpg")
webp_path = os.path.join(OUTPUT_DIR, "slide-07-world-clocks.webp")
img.save(jpg_path, "JPEG", quality=88, optimize=True)
img.save(webp_path, "WEBP", quality=85, method=6)

print(f"Saved: {os.path.getsize(jpg_path)/1024:.0f}KB jpg / {os.path.getsize(webp_path)/1024:.0f}KB webp")
