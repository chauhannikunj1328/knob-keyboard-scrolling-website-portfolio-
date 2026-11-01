import * as THREE from "three";
import { KEYS, type Key } from "./layout";
import type { KeyboardInputs, Screen } from "./keyboard";
import { MARK, MARK_DOT, MARK_STROKE } from "./mark";


const PX = 96; // atlas pixels per cm
const ATLAS = 2048;
const FONT = '"Inter", system-ui, sans-serif';

// Legends are printed in one quiet warm grey on the light caps, and in cream on the orange ones.
function inkOf(k: Key) {
  return k.tone === "orange" ? "#fff1e4" : k.tone === "dark" ? "#f4efe8" : "#6a6862";
}

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

// One atlas cell per key, shelf-packed in key order (2 px padding); each key
// gets a uv rect (offset.xy, scale.zw) into the legends image.
function packAtlas() {
  const cells: Cell[] = [];
  const rects: [number, number, number, number][] = [];
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const k of KEYS) {
    const w = Math.ceil(k.w * PX) + 4;
    const h = Math.ceil(k.d * PX) + 4;
    if (x + w > ATLAS) {
      x = 0;
      y += shelf;
      shelf = 0;
    }
    cells.push({ x: x + 2, y: y + 2, w: w - 4, h: h - 4 });
    rects.push([(x + 2) / ATLAS, 1 - (y + 2 + h - 4) / ATLAS, (w - 4) / ATLAS, (h - 4) / ATLAS]);
    x += w;
    shelf = Math.max(shelf, h);
  }
  return { cells, rects };
}

// The legends are drawn here, in the key layout's own order, so the atlas
// always matches the layout (the legend plane scales each cell onto its cap's face).
function drawAtlas(cells: Cell[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ATLAS;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  KEYS.forEach((k, i) => {
    const { x, y, w, h } = cells[i];
    const lg = k.legend;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x + w / 2, y + h / 2);
    const ink = inkOf(k);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineWidth = h * 0.05;
    ctx.lineCap = ctx.lineJoin = "round";
    const text = (s: string, size: number, dy = 0, weight = 500) => {
      ctx.font = `${weight} ${size}px ${FONT}`;
      const fit = Math.min(1, (w * 0.8) / ctx.measureText(s).width);
      ctx.font = `${weight} ${size * fit}px ${FONT}`;
      ctx.fillText(s, 0, dy);
    };
    if (lg.c) text(lg.c, h * (lg.c.length > 1 ? 0.3 : 0.36));
    if (lg.b) text(`${lg.b} ${lg.t}`, h * 0.3);
    if (lg.s) text(lg.s, h * 0.27, 0, 500);
    if (lg.arrow === "enter") {
      // the return arrow: down, then left
      const a = h * 0.16;
      ctx.beginPath();
      ctx.moveTo(a * 1.2, -a * 0.9);
      ctx.lineTo(a * 1.2, 0);
      ctx.lineTo(-a * 1.2, 0);
      ctx.moveTo(-a * 1.2 + h * 0.1, -h * 0.1);
      ctx.lineTo(-a * 1.2, 0);
      ctx.lineTo(-a * 1.2 + h * 0.1, h * 0.1);
      ctx.stroke();
    } else if (lg.arrow) {
      const s = h * 0.085;
      const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[lg.arrow];
      const [dx, dy] = d;
      ctx.beginPath();
      ctx.moveTo(-dx * s + dy * s, -dy * s + dx * s);
      ctx.lineTo(dx * s, dy * s);
      ctx.lineTo(-dx * s - dy * s, -dy * s - dx * s);
      ctx.stroke();
    }
    ctx.restore();
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// The battery's label: a plain silver sleeve with a little printed text.
function drawBattery() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#d9dadb";
  ctx.fillRect(0, 0, 1024, 200);
  ctx.fillStyle = "#4a4c50";
  ctx.font = `600 34px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("LITHIUM-ION CELL", 48, 70);
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText("SEALED · NOT USER-REPLACEABLE", 48, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// The knob's top: black anodised metal with fine turning rings and the icon set in, which
// also lets the knob be seen to turn.
function drawKnobFace() {
  const S = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const sweep = ctx.createConicGradient(0.6, S / 2, S / 2);
  const stops = ["#2a2a2d", "#161618", "#2e2e31", "#131315", "#2b2b2e", "#171719", "#2d2d30", "#141416", "#2a2a2d"];
  stops.forEach((c, i) => sweep.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, S, S);
  ctx.lineWidth = 1.5;
  for (let r = 6; r < S * 0.72; r += 5) {
    ctx.strokeStyle = `rgba(255,255,255,${r % 10 ? 0.025 : 0.05})`;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // the icon: a white pill outline with a dot, in the middle of the top
  const sc = (S * 0.82) / 100;
  ctx.save();
  ctx.translate(S / 2 - 50 * sc, S / 2 - 50 * sc);
  ctx.scale(sc, sc);
  ctx.lineWidth = MARK_STROKE;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.strokeStyle = ctx.fillStyle = "#fff";
  ctx.stroke(new Path2D(MARK));
  ctx.beginPath();
  ctx.arc(MARK_DOT.cx, MARK_DOT.cy, MARK_DOT.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// The display strip's screen, in the product's own timer sequence. Mode 0 is the clock (a black
// island with the time over the orange gradient). Mode 1 is the minutes picker: a ring icon, then
// 5 10 15 30 60 120, with an orange pill on the chosen row; level 0 → 1 slides the pill from 5 to
// 10. Mode 2 is the timer: an orange gradient panel over its countdown, which shrinks (and
// ticks down) as level, the share of the time left, falls from 1. Redrawn only when the page asks
// (see keyboard.ts → look.screen).
function createDisplay(): Screen {
  const W = 256;
  const H = 664;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const gradient = (y0: number, y1: number) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#f08a3c");
    g.addColorStop(0.5, "#f1b27c");
    g.addColorStop(1, "#f7e2d1");
    return g;
  };
  const MINUTES = [5, 10, 15, 30, 60, 120];
  const ROW0 = 141; // the first row's centre; the rows are 94 apart
  const PITCH = 94;
  // the timer's panel: its bottom edge stays put, and its top comes down as the time runs out
  const PANEL = { x: 28, top: 30, bottom: 548 };

  function clock() {
    ctx.fillStyle = gradient(10, H - 10);
    rr(10, 10, W - 20, H - 20, 62);
    ctx.fill();
    ctx.fillStyle = "#000";
    rr(34, 34, W - 68, 120, 44);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `700 54px ${FONT}`;
    ctx.fillText("9:00", W / 2, 80);
    ctx.fillStyle = "#e9e6e1";
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText("Thu, Apr 4", W / 2, 126);
  }

  function picker(t: number) {
    // the ring icon
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, 45, 22, 0, Math.PI * 2);
    ctx.stroke();
    // the pill rides from the 5 row to the 10 row
    const pillY = ROW0 + PITCH * t;
    ctx.fillStyle = "#e5833a";
    rr(W / 2 - 73, pillY - 34, 146, 68, 34);
    ctx.fill();
    MINUTES.forEach((m, i) => {
      const y = ROW0 + PITCH * i;
      const near = Math.abs(y - pillY) < PITCH / 2;
      ctx.fillStyle = "#fff";
      ctx.font = `${near ? 700 : 400} 42px ${FONT}`;
      ctx.fillText(String(m), W / 2, y + 2);
    });
  }

  function timer(left: number) {
    const full = PANEL.bottom - PANEL.top;
    const h = Math.max(70, full * left);
    const top = PANEL.bottom - h;
    ctx.fillStyle = gradient(top, PANEL.bottom);
    rr(PANEL.x, top, W - PANEL.x * 2, h, 56);
    ctx.fill();
    const secs = Math.round(left * 599);
    ctx.fillStyle = "#e0652a";
    ctx.font = `700 42px ${FONT}`;
    ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`, W / 2, 600);
  }

  function draw(mode: number, level: number) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    rr(0, 0, W, H, 70);
    ctx.clip();
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const t = Math.min(1, Math.max(0, level));
    if (mode === 1) picker(t);
    else if (mode === 2) timer(t);
    else clock();
    ctx.restore();
    texture.needsUpdate = true;
  }
  draw(0, 1);
  return { texture, draw };
}

// the soft glow around the knob's well: an ember tint
function drawGlow() {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,120,40,0.8)");
  g.addColorStop(0.35, "rgba(255,140,70,0.38)");
  g.addColorStop(1, "rgba(255,160,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// the soft shadow under the keyboard: a blurred rounded block, drawn off-canvas so only its
// shadow lands on the texture
function drawShadow() {
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.shadowColor = "rgba(40, 42, 38, 1)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetX = W * 2;
  ctx.fillRect(W * 0.11 - W * 2, H * 0.18, W * 0.78, H * 0.64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------- generated surface maps */

// The surface maps are drawn here rather than downloaded, so the page has nothing to fetch from
// anywhere else: a fine grain (as a normal map) for the caps and metal, a smudge map for the gloss,
// a soft light pool for each key, and the board's traces.
let seedState = 7;
const rand = () => ((seedState = (seedState * 16807) % 2147483647) / 2147483647);

function canvasOf(w: number, h = w) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function flatTexture(canvas: HTMLCanvasElement, { srgb = false, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

// fine, even grain: random heights turned into a tiling normal map
function drawGrain() {
  const S = 256;
  const h = new Float32Array(S * S);
  for (let i = 0; i < h.length; i++) h[i] = rand();
  // a light blur, so the grain is soft rather than pixel noise
  const b = new Float32Array(S * S);
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) b[y * S + x] = (at(x, y) * 4 + at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1)) / 8;
  const g = (x: number, y: number) => b[((y + S) % S) * S + ((x + S) % S)];
  const { canvas, ctx } = canvasOf(S);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (g(x + 1, y) - g(x - 1, y)) * 3;
      const dy = (g(x, y + 1) - g(x, y - 1)) * 3;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return flatTexture(canvas, { aniso: 8 });
}

// soft blotches, mostly light: they lower the roughness a little here and there
function drawSmudge() {
  const S = 512;
  const { canvas, ctx } = canvasOf(S);
  ctx.fillStyle = "#d4d4d4";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 20 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand() > 0.5;
    g.addColorStop(0, dark ? "rgba(150,150,150,0.45)" : "rgba(255,255,255,0.4)");
    g.addColorStop(1, "rgba(128,128,128,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return flatTexture(canvas);
}

// the pool of light a key's LED throws onto the plate: white in the middle, nothing at the edge
function drawLightPool() {
  const S = 128;
  const { canvas, ctx } = canvasOf(S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return flatTexture(canvas);
}

// the logic board's raised traces and pads (used as a bump map)
function drawBoard() {
  const W = 1024;
  const H = 384;
  const { canvas, ctx } = canvasOf(W, H);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#cfcfcf";
  ctx.fillStyle = "#e6e6e6";
  ctx.lineWidth = 2.5;
  ctx.lineCap = ctx.lineJoin = "round";
  for (let i = 0; i < 260; i++) {
    let x = rand() * W;
    let y = rand() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 3; k++) {
      if (rand() > 0.5) x += (rand() - 0.5) * 160;
      else y += (rand() - 0.5) * 100;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  return flatTexture(canvas, { srgb: true });
}

// onFile reports each step (for the loading bar), starting with (0, total)
export async function loadTextures(onFile?: (loaded: number, total: number) => void): Promise<KeyboardInputs> {
  const STEPS = 2;
  onFile?.(0, STEPS);
  // the legends use these faces: wait for them before drawing
  await Promise.all(['500 40px "Inter"', '600 40px "Inter"'].map((f) => document.fonts.load(f)));
  onFile?.(1, STEPS);
  const padTexture = drawLightPool();
  const pcbTexture = drawBoard();
  const grain = drawGrain();
  const smudge = drawSmudge();
  onFile?.(2, STEPS);
  const { cells, rects } = packAtlas();
  // the surface maps tile: ExtrudeGeometry UVs are in centimetres, so repeat sets the physical scale
  const tiled = (tex: THREE.Texture, cm: number) => {
    const t = tex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / cm, 1 / cm);
    t.needsUpdate = true;
    return t;
  };
  return {
    legend: { texture: drawAtlas(cells), rects },
    knobFace: drawKnobFace(),
    display: createDisplay(),
    knobGlow: drawGlow(),
    softShadow: drawShadow(),
    padTexture,
    pcbTexture,
    batteryTexture: drawBattery(),
    surface: { metalNormal: tiled(grain, 1.6), capNormal: tiled(grain, 0.9), smudge: tiled(smudge, 14), capSmudge: tiled(smudge, 6) },
  };
}

/* ------------------------------------------------------------- metal env */

// What polished metal and glass reflect: bright softbox strips on a mid grey room. The strips
// run top to bottom, so a turned cylinder picks them up as long vertical bands of light.
export function createMetalEnvironment(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const room = ctx.createLinearGradient(0, 0, 0, 1024);
  room.addColorStop(0, "#ffffff");
  room.addColorStop(0.42, "#a9adb8");
  room.addColorStop(0.6, "#6f737e");
  room.addColorStop(1, "#c4c7d0");
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, 2048, 1024);
  for (const [x, w, a] of [[120, 150, 1], [520, 70, 0.9], [860, 220, 1], [1290, 60, 0.85], [1620, 190, 1]]) {
    const strip = ctx.createLinearGradient(x, 0, x + w, 0);
    strip.addColorStop(0, "rgba(255,255,255,0)");
    strip.addColorStop(0.5, `rgba(255,255,255,${a})`);
    strip.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = strip;
    ctx.fillRect(x, 0, w, 1024);
  }
  for (const [x, w] of [[400, 90], [1120, 110], [1480, 70]]) {
    const band = ctx.createLinearGradient(x, 0, x + w, 0);
    band.addColorStop(0, "rgba(40,43,54,0)");
    band.addColorStop(0.5, "rgba(40,43,54,0.75)");
    band.addColorStop(1, "rgba(40,43,54,0)");
    ctx.fillStyle = band;
    ctx.fillRect(x, 0, w, 1024);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/* ------------------------------------------------------------ studio env */

// A black room with a few softboxes, so the satin caps and the case pick up
// crisp product-shot highlights rather than a grey wash.
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const box = (w: number, h: number, color: number, intensity: number, pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };
  box(7, 3, 0xffffff, 3.2, [0, 8, -3], [0, 0, 0]);
  box(14, 1.6, 0xffffff, 2.2, [0, 6.5, -10], [0, 0, 0]);
  box(14, 0.8, 0xffffff, 0.7, [0, 2.2, -10], [0, 0, 0]);
  box(2.2, 6, 0xdde6ff, 1.4, [-10, 3, 3], [0, 0, 0]);
  box(2.5, 4, 0xffb27a, 1.3, [10, 2, -1], [0, 0, 0]);
  box(10, 1, 0xffffff, 0.6, [0, 1.5, 11], [0, 0, 0]);
  // a dim warm bounce from below, so nothing falls to pure black
  box(40, 40, 0x2a2a26, 0.35, [0, -8, 0], [0, 0, 0]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return env;
}
