"""Crop official DJI product shots to the drone only and export 4:3 WebP.
Usage: python3 scripts/crop-drones.py OUT_DIR name=path [name=path ...]"""
import sys
from PIL import Image

def crop(src, dst):
    im = Image.open(src).convert("RGBA")
    a = im.split()[3]
    w, h = im.size
    px = a.load()
    rows = [any(px[x, y] > 16 for x in range(0, w, 2)) for y in range(h)]
    top = rows.index(True)
    end, gap = top, 0
    for y in range(top, h):
        if rows[y]:
            end, gap = y, 0
        else:
            gap += 1
            if gap > h * GAP:
                break
    im = im.crop((0, top, w, end + 1))
    im = im.crop(im.split()[3].point(lambda v: 255 if v > 16 else 0).getbbox())
    cw, ch = im.size
    W, H = 1200, 900
    s = min(W * 0.86 / cw, H * 0.78 / ch)
    im = im.resize((round(cw * s), round(ch * s)), Image.LANCZOS)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(im, ((W - im.width) // 2, (H - im.height) // 2), im)
    out.save(dst, "WEBP", quality=86, method=6)

GAP = float(__import__("os").environ.get("GAP", "0.03"))
out = sys.argv[1]
for arg in sys.argv[2:]:
    name, path = arg.split("=", 1)
    crop(path, f"{out}/{name}.webp")
    print("ok", name)
