"""Label-blind raster text reader for the PNG Drawing lane.

Reads the text a PNG actually shows: it isolates glyph-sized ink from flat
fills, groups glyphs into text lines and asks Tesseract to read each line. No
expected label, source, SVG, renderer model, ID or filename reaches the reader;
fidelity/drawing/png-labels.ts judges its readings against the label plan.
Every word keeps Tesseract's confidence, so the judge can refuse weak reads.
A raster outside the reader's bounds is reported unreadable, never empty.
"""
import base64, hashlib, io, json, subprocess, sys
import numpy as np
from PIL import Image

SCALE = 3                 # Tesseract reads 1x diagram text poorly; glyphs are enlarged
INK_CONTRAST = 48         # max channel difference from the local flat backdrop
FLAT_RADIUS = 4           # a backdrop pixel is flat over a 9x9 window (glyph strokes are thinner)
MAX_PIXELS = 12_000_000
MAX_INK = 800_000
MAX_SHEET = 60_000_000
TRAINEDDATA = '/usr/share/tesseract-ocr/5/tessdata/eng.traineddata'

def identity():
    version = subprocess.run(['tesseract', '--version'], capture_output=True, text=True, timeout=15).stdout.splitlines()[0]
    with open(TRAINEDDATA, 'rb') as stream: data = hashlib.sha256(stream.read()).hexdigest()
    return {'tesseract': version, 'engTraineddataSha256': data, 'numpy': np.__version__, 'pillow': Image.__version__, 'scale': SCALE, 'inkContrast': INK_CONTRAST, 'flatRadius': FLAT_RADIUS}

def shift_all(mask, radius):
    """Erode a boolean mask by a square of the given radius."""
    h, w = mask.shape
    for _ in range(radius):
        padded = np.pad(mask, 1); eroded = mask.copy()
        for dy in (0, 1, 2):
            for dx in (0, 1, 2): eroded &= padded[dy:dy + h, dx:dx + w]
        mask = eroded
    return mask

def components(mask):
    """8-connected components as pixel lists and boxes (x0, y0, x1, y1)."""
    points = set(zip(*(axis.tolist() for axis in np.nonzero(mask))))
    found = []
    while points:
        first = points.pop(); todo = [first]; pixels = [first]
        while todo:
            y, x = todo.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    q = (y + dy, x + dx)
                    if q in points: points.remove(q); todo.append(q); pixels.append(q)
        ys = [p[0] for p in pixels]; xs = [p[1] for p in pixels]
        found.append({'pixels': pixels, 'box': (min(xs), min(ys), max(xs) + 1, max(ys) + 1)})
    return found

def tesseract(image, psm):
    buffer = io.BytesIO(); image.save(buffer, format='PNG')
    run = subprocess.run(['tesseract', 'stdin', 'stdout', '--psm', psm, '-l', 'eng', 'tsv'], input=buffer.getvalue(), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=120)
    if run.returncode: raise RuntimeError('Tesseract failed')
    words = []
    for row in run.stdout.decode().splitlines()[1:]:
        p = row.split('\t')
        if len(p) < 12 or not p[11].strip(): continue
        words.append((p[11].strip(), float(p[10]), int(p[6]), int(p[7]), int(p[8]), int(p[9])))
    return words

def read(png):
    image = Image.open(io.BytesIO(png))
    if image.format != 'PNG': return {'status': 'unknown', 'reason': 'Not a PNG'}
    image = image.convert('RGBA'); w, h = image.size
    rgba = np.asarray(image)
    uniform = bool((rgba == rgba[0, 0]).all())
    if uniform: return {'status': 'observed', 'uniform': True, 'width': w, 'height': h, 'lines': []}
    if w * h > MAX_PIXELS: return {'status': 'unknown', 'reason': 'Raster reader pixel bound exceeded'}
    backdrop = Image.new('RGBA', image.size, 'white'); backdrop.alpha_composite(image)
    rgb = np.asarray(backdrop.convert('RGB')).astype(np.int16)
    padded = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode='edge')
    flat = np.ones((h, w), bool)
    for dy in (0, 1, 2):
        for dx in (0, 1, 2): flat &= np.max(np.abs(padded[dy:dy + h, dx:dx + w] - rgb), axis=2) <= 6
    flat = shift_all(flat, FLAT_RADIUS - 1)
    # Each pixel's backdrop is the nearest flat colour, grown outward from the fills.
    back = np.where(flat[..., None], rgb, -1); known = flat.copy()
    for _ in range(96):
        if known.all(): break
        p = np.pad(back, ((1, 1), (1, 1), (0, 0)), constant_values=-1); k = np.pad(known, 1)
        for dy, dx in ((0, 1), (2, 1), (1, 0), (1, 2)):
            take = ~known & k[dy:dy + h, dx:dx + w]
            back[take] = p[dy:dy + h, dx:dx + w][take]; known |= take
    back[~known] = rgb[~known]
    contrast = np.max(np.abs(rgb - back), axis=2)
    ink = contrast > INK_CONTRAST
    if int(ink.sum()) > MAX_INK: return {'status': 'unknown', 'reason': 'Raster reader ink bound exceeded'}
    # Glyph-sized components only: frames, long rules and routes are not text.
    glyphs = []
    for c in components(ink):
        x0, y0, x1, y1 = c['box']; bw, bh = x1 - x0, y1 - y0
        if bh > 48 or (bh <= 3 and bw > 14) or (bw <= 3 and bh > 30): continue
        glyphs.append(c)
    n = len(glyphs); parent = list(range(n))
    def find(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    order = sorted(range(n), key=lambda i: glyphs[i]['box'][0])
    for a in range(n):
        A = glyphs[order[a]]['box']
        for b in range(a + 1, n):
            B = glyphs[order[b]]['box']
            hh = max(A[3] - A[1], B[3] - B[1], 6)
            if B[0] - A[2] > hh * 0.9: break
            overlap = min(A[3], B[3]) - max(A[1], B[1]); low = min(A[3] - A[1], B[3] - B[1]) <= 3
            big, small = (A, B) if A[3] - A[1] >= B[3] - B[1] else (B, A)
            if (low and big[1] <= (small[1] + small[3]) / 2 <= big[3] + 3) or (overlap >= 0.4 * min(A[3] - A[1], B[3] - B[1]) and max(abs(A[1] - B[1]), abs(A[3] - B[3])) < hh):
                parent[find(order[a])] = find(order[b])
    groups = {}
    for i in range(n): groups.setdefault(find(i), []).append(glyphs[i])
    lines = []
    for group in groups.values():
        x0 = min(c['box'][0] for c in group); y0 = min(c['box'][1] for c in group); x1 = max(c['box'][2] for c in group); y1 = max(c['box'][3] for c in group)
        if y1 - y0 < 5: continue
        mask = np.zeros((y1 - y0, x1 - x0), bool)
        for c in group:
            for y, x in c['pixels']: mask[y - y0, x - x0] = True
        grown = mask.copy(); pm = np.pad(mask, 1)
        for dy in (0, 1, 2):
            for dx in (0, 1, 2): grown |= pm[dy:dy + mask.shape[0], dx:dx + mask.shape[1]]
        # Dark glyphs on white whatever the original colours, from measured contrast only.
        level = 255 - np.minimum(255, np.where(grown, contrast[y0:y1, x0:x1], 0) * 2)
        tile = Image.fromarray(level.astype(np.uint8), 'L').resize(((x1 - x0) * SCALE, (y1 - y0) * SCALE), Image.LANCZOS)
        lines.append({'box': [int(x0), int(y0), int(x1), int(y1)], 'glyphs': len(group), 'tile': Image.eval(tile, lambda v: 0 if v < 160 else 255), 'words': []})
    lines.sort(key=lambda line: (line['box'][1], line['box'][0]))
    # One sheet, one line per row, read as a uniform block.
    y = 20; width = 1; placed = []
    for line in lines:
        placed.append(y); y += line['tile'].height + max(40, line['tile'].height); width = max(width, line['tile'].width + 80)
    if width * (y + 20) > MAX_SHEET: return {'status': 'unknown', 'reason': 'Raster reader sheet bound exceeded'}
    if lines:
        sheet = Image.new('L', (width, y + 20), 255)
        for line, top in zip(lines, placed): sheet.paste(line['tile'], (40, top))
        for text, conf, wx, wy, ww, wh in tesseract(sheet, '6'):
            for line, top in zip(lines, placed):
                if top - SCALE * 4 <= wy + wh / 2 <= top + line['tile'].height + SCALE * 4:
                    x0, y0 = line['box'][:2]
                    line['words'].append({'text': text, 'conf': conf, 'box': [x0 + (wx - 40) / SCALE, y0 + (wy - top) / SCALE, ww / SCALE, wh / SCALE]})
                    break
    # A line the block read did not read confidently is read alone once, as one
    # line (or one character for a single glyph). The more confident reading is
    # kept only when it is itself confident: no label decides which is kept.
    for line in lines:
        if line['words'] and min(word['conf'] for word in line['words']) >= 90: continue
        tile = line['tile']; pad = Image.new('L', (tile.width + 80, tile.height + 80), 255); pad.paste(tile, (40, 40))
        x0, y0 = line['box'][:2]
        words = [{'text': text, 'conf': conf, 'box': [x0 + (wx - 40) / SCALE, y0 + (wy - 40) / SCALE, ww / SCALE, wh / SCALE]} for text, conf, wx, wy, ww, wh in tesseract(pad, '10' if line['glyphs'] == 1 else '7')]
        if words and min(word['conf'] for word in words) >= 90 and (not line['words'] or min(word['conf'] for word in words) > min(word['conf'] for word in line['words'])):
            line['words'] = words
    return {'status': 'observed', 'uniform': False, 'width': w, 'height': h, 'lines': [{'box': line['box'], 'words': line['words']} for line in lines]}

if __name__ == '__main__':
    for raw in sys.stdin:
        job = json.loads(raw)
        try: result = {'status': 'identity', 'identity': identity()} if job.get('identity') else read(base64.b64decode(job['png'], validate=True))
        except Exception as error: result = {'status': 'unknown', 'reason': 'Raster reader unavailable: ' + type(error).__name__ + ': ' + str(error)[:200]}
        result['id'] = job.get('id'); print(json.dumps(result), flush=True)
