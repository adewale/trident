import { chromium } from "playwright";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const PROTOCOL = "native-entrypoints-v2";
// Published pele@1.9.0 dist/pele.js, independently retained in the original artifact receipt.
const PELE_190_SHA256 = "7c40a25eeaf4370fb56c03d9d8f6780051c9c39b6c6ca36d53239075117097f5";
const base = path.dirname(fileURLToPath(import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function verifyPeleModule(override = process.env.PELE_MODULE) {
  const installedPath = fileURLToPath(import.meta.resolve("pele"));
  const installedPackage = JSON.parse(fs.readFileSync(fileURLToPath(import.meta.resolve("pele/package.json"))));
  if (installedPackage.name !== "pele" || installedPackage.version !== "1.9.0") {
    throw Error("Installed Pele must be exactly 1.9.0");
  }
  const installedHash = sha256(fs.readFileSync(installedPath));
  if (installedHash !== PELE_190_SHA256) throw Error("Installed Pele 1.9.0 entry digest differs from the published artifact receipt");
  const selectedPath = path.resolve(override || installedPath);
  const bytes = fs.readFileSync(selectedPath);
  if (sha256(bytes) !== installedHash) throw Error("PELE_MODULE differs from the installed pinned Pele 1.9.0 module");
  // A copied standalone file is allowed only with identical bytes. If it belongs
  // to a Pele package, reject a contradictory package version as well.
  for (let dir = path.dirname(selectedPath); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (fs.existsSync(manifest)) {
      const pkg = JSON.parse(fs.readFileSync(manifest));
      if (pkg.name === "pele" && pkg.version !== "1.9.0") throw Error("PELE_MODULE package must be exactly Pele 1.9.0");
      break;
    }
    if (path.dirname(dir) === dir) break;
  }
  return { bytes, identity: { version: installedPackage.version, installed_path: installedPath, selected_path: selectedPath, sha256: installedHash } };
}

export function withDeadline(promise, milliseconds, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = Error(`${label} exceeded ${milliseconds}ms`);
      error.name = "DeadlineError";
      reject(error);
    }, milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// These two functions are serialized by Playwright; keep them self-contained.
export async function preparePhase({ c, api, phase }) {
  const host = document.querySelector("#host"), p = window.pele;
  const row = { protocol: "native-entrypoints-v2", id: c.id, api, phase,
    measured_call_started: false, source_before: window.benchSource ?? null, source_after: null };
  try {
    window.handle?.destroy();
    window.handle = null;
    host.replaceChildren();
    window.benchSource = null;
    if (phase !== "fresh") {
      window.benchSource = c.source;
      row.source_after = c.source;
      if (api === "render") host.innerHTML = p.render(c.source).svg;
      else {
        window.handle = p.mount(host, c.source);
        if (window.handle.error) throw window.handle.error;
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    row.status = "ready";
    row.failure_stage = null;
  } catch (error) {
    row.status = "error";
    row.source_after = window.benchSource ?? null;
    row.failure_stage = "preparation";
    row.error = String(error);
  }
  return row;
}

export async function measureSample({ c, api, phase, i }) {
  const host = document.querySelector("#host"), p = window.pele;
  const source = phase === "update" && i % 2 === 0 ? c.updatedSource : c.source;
  const row = { protocol: "native-entrypoints-v2", id: c.id, api, phase, sample: i,
    sourceUpdated: source !== c.source, requested_source: source,
    source_before: window.benchSource ?? null, source_after: window.benchSource ?? null,
    measured_call_started: false, failure_stage: "preparation" };
  let start, url;
  try {
    if (phase === "fresh") {
      window.handle?.destroy();
      window.handle = null;
      host.replaceChildren();
      window.benchSource = null;
      row.source_before = row.source_after = null;
    } else if (api === "mount" && !window.handle) {
      throw Error("No mounted handle after phase preparation; update was not invoked");
    }
    // Persist the operation identity outside its API clock, so a renderer stall
    // can be identified by the outer watchdog without querying a stuck page.
    await window.benchCallStarted?.({ source_before: row.source_before, source_after: source });
    row.failure_stage = "operation";
    row.measured_call_started = true;
    window.benchSource = row.source_after = source;
    start = performance.now();
    let svg;
    if (api === "render") {
      const result = p.render(source);
      row.svg_return_ms = performance.now() - start;
      svg = result.svg;
      row.failure_stage = "dom_insertion";
      const t = performance.now();
      host.innerHTML = svg;
      row.dom_insertion_ms = performance.now() - t;
    } else {
      if (phase === "fresh") window.handle = p.mount(host, source);
      else window.handle.update(source);
      row.mount_update_ms = performance.now() - start;
      if (window.handle.error) throw window.handle.error;
      svg = window.handle.result?.svg;
    }
    row.api_dom_ms = performance.now() - start;
    row.failure_stage = "frame_completion";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    row.two_raf_ms = performance.now() - start;
    row.failure_stage = "validation";
    const el = host.querySelector("svg");
    if (!el) throw Error("no SVG DOM");
    row.svgLabels = [...el.querySelectorAll("text,foreignObject")].map((x) => x.textContent);
    row.dom_elements = el.querySelectorAll("*").length;
    row.failure_stage = "svg_decode";
    const t = performance.now(), blob = new Blob([svg], { type: "image/svg+xml" }), img = new Image();
    url = URL.createObjectURL(blob);
    img.src = url;
    await img.decode();
    row.svg_decode_ms = performance.now() - t;
    const width = Math.ceil(img.naturalWidth), height = Math.ceil(img.naturalHeight);
    if (!Number.isFinite(width * height) || width <= 0 || height <= 0 || width * height > 64e6) throw Error("invalid raster size");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    row.failure_stage = "canvas_draw";
    let a = performance.now();
    ctx.drawImage(img, 0, 0);
    row.canvas_draw_ms = performance.now() - a;
    row.failure_stage = "pixel_readback";
    a = performance.now();
    const pixels = ctx.getImageData(0, 0, width, height);
    row.pixel_readback_ms = performance.now() - a;
    row.width = width;
    row.height = height;
    let hash = 2166136261;
    for (const v of pixels.data) hash = Math.imul(hash ^ v, 16777619) >>> 0;
    row.pixel_hash = hash;
    let painted = 0;
    for (let j = 0; j < pixels.data.length; j += 4) if (pixels.data[j + 3] && Math.min(pixels.data[j], pixels.data[j + 1], pixels.data[j + 2]) < 240) painted++;
    row.painted_pixels = painted;
    row.failure_stage = "png_encoding";
    a = performance.now();
    const png = await new Promise((r) => canvas.toBlob(r, "image/png"));
    if (!png) throw Error("PNG encoder returned no data");
    row.png_encode_ms = performance.now() - a;
    row.png_bytes = png.size;
    row.status = painted ? "painted" : "blank";
    row.failure_stage = null;
  } catch (error) {
    row.status = "error";
    row.error = String(error);
    if (start !== undefined) row.failed_after_ms = performance.now() - start;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
  return row;
}

function positiveInteger(value, fallback, name, minimum = 1) {
  const n = Number(value ?? fallback);
  if (!Number.isSafeInteger(n) || n < minimum) throw Error(`Invalid ${name}: ${value}`);
  return n;
}

export async function runCampaign() {
  // Identity failures must not reserve or modify an output directory.
  const { bytes, identity } = verifyPeleModule();
  if (process.env.BENCH_PROTOCOL && process.env.BENCH_PROTOCOL !== PROTOCOL) throw Error("Incompatible BENCH_PROTOCOL");
  const out = path.resolve(process.env.OUT || base + "/results/pele");
  fs.mkdirSync(out, { recursive: true });
  // Atomic and retained after completion/failure: concurrent writers cannot pass.
  const reservation = fs.openSync(out + "/.browser-reservation.json", "wx");
  fs.writeFileSync(reservation, JSON.stringify({ protocol: PROTOCOL, pid: process.pid, started_at: new Date().toISOString() }));
  fs.closeSync(reservation);
  const supervisorFiles = new Set([".browser-reservation.json", ".supervisor-reservation.json", "supervisor.json", "stdout.log", "stderr.log", "process-events.jsonl"]);
  if (fs.readdirSync(out).some((name) => !supervisorFiles.has(name))) throw Error("Output contains earlier browser evidence: " + out);
  const writeJson = (name, value) => {
    fs.writeFileSync(out + "/" + name + ".tmp", JSON.stringify(value, null, 2));
    fs.renameSync(out + "/" + name + ".tmp", out + "/" + name);
  };
  const append = (name, value) => {
    const fd = fs.openSync(out + "/" + name, "a");
    try { fs.writeFileSync(fd, JSON.stringify({ protocol: PROTOCOL, ...value }) + "\n"); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); }
  };
  const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
  const receipt = { protocol: PROTOCOL, status: "preflight", started_at: new Date().toISOString(),
    hostname: os.hostname(), architecture: os.arch(), platform: os.platform(), os_release: os.release(), node: process.version,
    headless: process.env.HEADED !== "1", executable: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium", flags,
    source_tracking: "source_before/source_after are the last input passed to the public API, including failed calls; requested_source is the intended measured input" };
  writeJson("browser-receipt.json", receipt);
  let server, browser, activeCall = null;
  let sampleFd;
  const saveActive = (value) => { activeCall = { protocol: PROTOCOL, ...value }; writeJson("active-call.json", activeCall); };
  try {
    receipt.pele = identity;
    receipt.playwright = JSON.parse(fs.readFileSync(fileURLToPath(import.meta.resolve("playwright/package.json")))).version;
    const rounds = positiveInteger(process.env.ROUNDS, 3, "ROUNDS");
    const samples = positiveInteger(process.env.SAMPLES, 5, "SAMPLES");
    const warmups = positiveInteger(process.env.WARMUPS, 2, "WARMUPS", 0);
    const callDeadline = positiveInteger(process.env.BROWSER_CALL_TIMEOUT_MS, 30000, "BROWSER_CALL_TIMEOUT_MS");
    const casesPath = path.resolve(process.env.CASES_FILE || base + "/cases.json");
    const caseBytes = fs.readFileSync(casesPath);
    const cases = JSON.parse(caseBytes).filter((c) => !process.env.ONLY_CASE || c.id === process.env.ONLY_CASE);
    const apis = ["render", "mount"].filter((a) => !process.env.ONLY_API || a === process.env.ONLY_API);
    const phases = ["fresh", "repeat", "update"].filter((a) => !process.env.ONLY_PHASE || a === process.env.ONLY_PHASE);
    if (!cases.length || !apis.length || !phases.length) throw Error("Selectors matched no cases, APIs or phases");
    for (const c of cases) if (typeof c.source !== "string" || typeof c.updatedSource !== "string") throw Error("Case requires original and updated sources: " + c.id);
    receipt.plan = { rounds, samples, warmups, call_deadline_ms: callDeadline, cases_path: casesPath,
      cases_sha256: sha256(caseBytes), cases: cases.map((c) => c.id), apis, phases };
    receipt.status = "starting";
    writeJson("browser-receipt.json", receipt);
    sampleFd = fs.openSync(out + "/samples.jsonl", "wx");
    server = http.createServer((req, res) => {
      if (req.url === "/pele.js") {
        res.setHeader("content-type", "application/javascript");
        res.end(bytes); // Serve exactly the bytes verified in preflight.
      } else res.end('<!doctype html><style>body{margin:0;background:white}#host{width:1000px;height:700px;overflow:hidden}svg{max-width:100%;max-height:100%}</style><div id="host"></div>');
    });
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    browser = await withDeadline(chromium.launch({ executablePath: receipt.executable, headless: receipt.headless, args: flags, timeout: callDeadline }), callDeadline, "browser launch");
    receipt.version = browser.version();
    receipt.status = "running";
    writeJson("browser.json", receipt);
    writeJson("browser-receipt.json", receipt);
    const evaluate = async (page, fn, arg, context) => {
      saveActive({ source_before: activeCall?.source_after ?? null, source_after: activeCall?.source_after ?? null, ...context, status: "pending", measured_call_started: false, failure_stage: "preparation" });
      try { return await withDeadline(page.evaluate(fn, arg), callDeadline, "browser call"); }
      catch (error) {
        const row = { ...activeCall, status: error.name === "DeadlineError" ? "timeout" : "error", error: String(error) };
        append("browser-events.jsonl", row);
        if (context.kind === "sample") {
          fs.writeSync(sampleFd, JSON.stringify(row) + "\n"); fs.fsyncSync(sampleFd);
        }
        // A rejected evaluation leaves browser state unknown; retain the failure
        // and stop rather than emitting further rows against a broken page.
        throw error;
      }
    };
    let count = 0;
    for (let round = 0; round < rounds; round++) {
      const page = await withDeadline(browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1 }), callDeadline, "new page");
      page.setDefaultTimeout(callDeadline);
      await page.exposeBinding("benchCallStarted", (_, fields) => saveActive({ ...activeCall, ...fields, measured_call_started: true, failure_stage: "operation" }));
      await page.goto("http://127.0.0.1:" + server.address().port, { timeout: callDeadline });
      await withDeadline(page.evaluate(async () => { window.pele = await import("/pele.js"); await document.fonts.ready; window.handle = null; window.benchSource = null; }), callDeadline, "module and fonts");
      for (const c of cases) for (const api of apis) for (const phase of phases) {
        const preparation = await evaluate(page, preparePhase, { c, api, phase }, { kind: "preparation", id: c.id, api, phase, round, requested_source: phase === "fresh" ? null : c.source });
        append("preparation.jsonl", { ...preparation, round });
        for (let i = -warmups; i < samples; i++) {
          const source = phase === "update" && i % 2 === 0 ? c.updatedSource : c.source;
          const context = { kind: "sample", id: c.id, api, phase, round, sample: i, sourceUpdated: source !== c.source, requested_source: source };
          const row = { ...await evaluate(page, measureSample, { c, api, phase, i }, context), round };
          fs.writeSync(sampleFd, JSON.stringify(row) + "\n"); fs.fsyncSync(sampleFd);
          saveActive({ ...context, ...row, status: row.status });
          count++;
          if (round === 0 && i === 0 && (phase === "fresh" || phase === "update")) {
            const stem = c.id.replaceAll(/[^a-zA-Z0-9_-]/g, "_") + "_" + api + "_" + phase;
            try {
              await withDeadline(page.screenshot({ path: out + "/" + stem + ".png", timeout: callDeadline }), callDeadline, "screenshot");
              fs.writeFileSync(out + "/" + stem + ".html", await withDeadline(page.locator("#host").innerHTML(), callDeadline, "DOM evidence"));
            } catch (error) {
              append("browser-events.jsonl", { ...context, status: "evidence_error", failure_stage: "capture", error: String(error) });
              if (error.name === "DeadlineError") throw error;
            }
          }
        }
      }
      await withDeadline(page.close(), callDeadline, "page close");
      console.log("Pele round", round, "rows", count);
    }
    receipt.status = "completed";
    receipt.rows = count;
  } catch (error) {
    receipt.status = error.name === "DeadlineError" ? "timeout" : "error";
    receipt.error = String(error);
    append("browser-events.jsonl", { status: receipt.status, error: receipt.error, active_call: activeCall });
    throw error;
  } finally {
    try {
      if (browser) await withDeadline(browser.close(), 5000, "browser cleanup");
    } catch (error) {
      receipt.cleanup_error = String(error);
      if (receipt.status === "completed") receipt.status = "error";
    } finally {
      if (server) {
        server.closeAllConnections();
        server.close();
      }
      if (sampleFd !== undefined) fs.closeSync(sampleFd);
      receipt.finished_at = new Date().toISOString();
      writeJson("browser-receipt.json", receipt);
      if (receipt.version) writeJson("browser.json", receipt);
    }
  }
  if (receipt.status !== "completed") throw Error(receipt.cleanup_error || receipt.status);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCampaign().catch((error) => { console.error(error); process.exit(1); });
}
