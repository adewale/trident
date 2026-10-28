import { chromium } from "playwright";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
const base = path.dirname(fileURLToPath(import.meta.url)), out = process.env.OUT || base + "/results/pele";
fs.mkdirSync(out, { recursive: true });
if (fs.existsSync(out + "/samples.jsonl")) throw Error("Output already contains samples: " + out);
const peleModule = process.env.PELE_MODULE || fileURLToPath(import.meta.resolve("pele"));
const cases = JSON.parse(fs.readFileSync(process.env.CASES_FILE || base + "/cases.json")).filter((c) => !process.env.ONLY_CASE || c.id === process.env.ONLY_CASE);
const server = http.createServer((req, res) => {
  if (req.url === "/pele.js") {
    res.setHeader("content-type", "application/javascript");
    res.end(fs.readFileSync(peleModule));
  } else {
    res.end('<!doctype html><style>body{margin:0;background:white}#host{width:1000px;height:700px;overflow:hidden}svg{max-width:100%;max-height:100%}</style><div id="host"></div>');
  }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.on("listening", r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium", headless: process.env.HEADED !== "1", args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const rows = [];
for (let round = 0; round < Number(process.env.ROUNDS || 3); round++) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.evaluate(async () => {
    window.pele = await import("/pele.js");
    await document.fonts.ready;
    window.handle = null;
  });
  for (const c of cases) for (const api of ["render", "mount"].filter((a) => !process.env.ONLY_API || a === process.env.ONLY_API)) for (const phase of ["fresh", "repeat", "update"].filter((a) => !process.env.ONLY_PHASE || a === process.env.ONLY_PHASE)) {
    for (let i = -Number(process.env.WARMUPS ?? 2); i < Number(process.env.SAMPLES || 5); i++) {
      const row = await page.evaluate(async ({ c: c2, api: api2, phase: phase2, i: i2 }) => {
        const host = document.querySelector("#host"), p = window.pele;
        const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const reset = () => {
          window.handle?.destroy();
          window.handle = null;
          host.replaceChildren();
        };
        if (phase2 === "fresh" || !window.handle && api2 === "mount") {
          reset();
          if (phase2 !== "fresh") {
            window.handle = p.mount(host, c2.source);
            await frames();
          }
        }
        if (api2 === "render" && phase2 !== "fresh") {
          host.innerHTML = p.render(c2.source).svg;
          await frames();
        }
        const source = phase2 === "update" ? i2 % 2 === 0 ? c2.updatedSource : c2.source : c2.source;
        const row2 = { id: c2.id, api: api2, phase: phase2, sample: i2, sourceUpdated: source !== c2.source };
        let svg;
        const start = performance.now();
        try {
          if (api2 === "render") {
            const result = p.render(source);
            row2.svg_return_ms = performance.now() - start;
            svg = result.svg;
            const t2 = performance.now();
            host.innerHTML = svg;
            row2.dom_insertion_ms = performance.now() - t2;
          } else {
            if (phase2 === "fresh") window.handle = p.mount(host, source);
            else window.handle.update(source);
            row2.mount_update_ms = performance.now() - start;
            if (window.handle.error) throw window.handle.error;
            svg = window.handle.result?.svg;
          }
          row2.api_dom_ms = performance.now() - start;
          await frames();
          row2.two_raf_ms = performance.now() - start;
          const el = host.querySelector("svg");
          if (!el) throw Error("no SVG DOM");
          row2.svgLabels = [...el.querySelectorAll("text,foreignObject")].map((x) => x.textContent);
          row2.dom_elements = el.querySelectorAll("*").length;
          const t = performance.now(), blob = new Blob([svg], { type: "image/svg+xml" }), url = URL.createObjectURL(blob), img = new Image();
          img.src = url;
          await img.decode();
          row2.svg_decode_ms = performance.now() - t;
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(img.naturalWidth);
          canvas.height = Math.ceil(img.naturalHeight);
          if (!canvas.width || !canvas.height || canvas.width * canvas.height > 64e6) throw Error("invalid raster size");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          let a = performance.now();
          ctx.drawImage(img, 0, 0);
          row2.canvas_draw_ms = performance.now() - a;
          a = performance.now();
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          row2.pixel_readback_ms = performance.now() - a;
          row2.width = canvas.width;
          row2.height = canvas.height;
          let hash = 2166136261;
          for (const v of pixels.data) hash = Math.imul(hash ^ v, 16777619) >>> 0;
          row2.pixel_hash = hash;
          let painted = 0;
          for (let j = 0; j < pixels.data.length; j += 4) if (pixels.data[j + 3] && Math.min(pixels.data[j], pixels.data[j + 1], pixels.data[j + 2]) < 240) painted++;
          row2.painted_pixels = painted;
          a = performance.now();
          const png = await new Promise((r) => canvas.toBlob(r, "image/png"));
          row2.png_encode_ms = performance.now() - a;
          row2.png_bytes = png.size;
          URL.revokeObjectURL(url);
          row2.status = painted ? "painted" : "blank";
        } catch (e) {
          row2.status = "error";
          row2.error = String(e);
          row2.failed_after_ms = performance.now() - start;
        }
        return row2;
      }, { c, api, phase, i }).catch((e) => ({ id: c.id, api, phase, sample: i, status: "error", error: String(e) }));
      row.round = round;
      rows.push(row);
      fs.appendFileSync(out + "/samples.jsonl", JSON.stringify(row) + "\n");
      if (round === 0 && i === 0 && (phase === "fresh" || phase === "update")) {
        await page.screenshot({ path: out + "/" + c.id.replaceAll(":", "_") + "_" + api + "_" + phase + ".png" });
        const svg = await page.locator("#host").innerHTML();
        fs.writeFileSync(out + "/" + c.id.replaceAll(":", "_") + "_" + api + "_" + phase + ".html", svg);
      }
    }
  }
  await page.close();
  console.log("Pele round", round, "rows", rows.length);
}
fs.writeFileSync(out + "/browser.json", JSON.stringify({ version: browser.version(), headless: process.env.HEADED !== "1", flags: ["--use-gl=angle", "--use-angle=swiftshader"] }, null, 2));
await browser.close();
server.close();
