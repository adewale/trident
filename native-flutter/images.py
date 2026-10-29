from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, subprocess

b = Path(__file__).parent / "results"
sheet = Image.new("RGB", (1200, 1090), "#ededed")
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17)
selection = [
    ("Flutter MermaidDiagram: flow5", "flutter/core_flow5_MermaidDiagram_fresh.png"),
    ("Pele render + DOM: flow5", "pele/core_flow5_render_fresh.png"),
    (
        "Flutter MermaidView: sequence",
        "flutter/registry_sequence_MermaidView_fresh.png",
    ),
    ("Pele mount: sequence", "pele/registry_sequence_mount_fresh.png"),
    ("Flutter renderToPng: pie", "flutter/registry_pie_renderToPng_fresh.png"),
    ("Pele render + DOM: pie", "pele/registry_pie_render_fresh.png"),
]
for i, (label, path) in enumerate(selection):
    im = Image.open(b / path).convert("RGBA")
    white = Image.new("RGBA", im.size, "white")
    white.alpha_composite(im)
    im = white.convert("RGB")
    im.thumbnail((590, 325))
    x = (i % 2) * 600
    y = (i // 2) * 360
    sheet.paste(im, (x + (600 - im.width) // 2, y + 30))
    d.text((x + 12, y + 7), label, fill="black", font=font)
sheet.save(b / "representative-images.jpg", quality=92)
# OCR is a diagnostic, outside all measurement passes. It is not a semantic oracle.
ocr = {}
for label, path in selection:
    p = b / path
    result = subprocess.run(
        ["tesseract", str(p), "stdout", "--psm", "11"], capture_output=True, text=True
    )
    ocr[path] = result.stdout
(b / "representative-ocr.json").write_text(json.dumps(ocr, indent=2))
