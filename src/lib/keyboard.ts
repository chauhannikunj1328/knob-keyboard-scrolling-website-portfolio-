import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { KEYS, KNOBS, KNOB_R, DISPLAY, WINDOWS, BODY_W, BODY_D, U, CAP_GAP, uX, uZ, type Key, type Tone } from "./layout";
export interface LegendAtlas { texture: THREE.Texture; rects: [number, number, number, number][] }
export interface SurfaceMaps { metalNormal: THREE.Texture; capNormal: THREE.Texture; smudge: THREE.Texture; capSmudge: THREE.Texture }

// A low-profile mechanical keyboard, built the way real ones are
// (the KNOB board: 329 × 128 × 22 mm). Top to bottom: keycaps on MX-style stems; switches
// whose top housing sits on a 1.5 mm aluminium plate (14 mm square cutouts)
// and whose bottom housing passes through it; stabilizers under the long
// keys; dampening foam between plate and board; the 1.6 mm logic board
// (per-key LED north of each switch, a diode beside it); the battery; and the
// aluminium case the whole stack drops into.
//
// Local y of each layer's centre when assembled (the case's underside sits on
// y = 0) and how far it travels when the keyboard splits apart. Switches are
// measured from the plate's top face, where their top housings sit.
export const LAYERS = {
  caps: { y: 1.72, lift: 17.0 }, // 1.40–2.04: low caps, the skirts sit right down at the case
  switch: { y: 1.12, lift: 12.8 },
  frame: { y: 1.025, lift: 9.4 }, // the top case, 0.70–1.35
  plate: { y: 1.045, lift: 6.2 }, // 0.97–1.12
  foam: { y: 0.825, lift: 3.2 }, // (not part of the real build: kept at rest, never drawn)
  pcb: { y: 0.6, lift: 2.4 }, // 0.52–0.68
  battery: { y: 0.3, lift: -1.0 },
  base: { y: 0.35, lift: -4.6 }, // the bottom case, 0–0.7
};
export type LayerName = keyof typeof LAYERS;
export const LAYER_ORDER: LayerName[] = ["caps", "switch", "frame", "plate", "foam", "pcb", "battery", "base"];

// keycap: a hollow shell with a cross socket inside. KNOB's caps are low and squat, in two tiers:
// a wide soft-cornered base (to hs), then a smaller rounded plateau that carries the legend.
const CAP = { h: 0.64, hs: 0.34, inset: 0.2, rBot: 0.22, rTop: 0.16, fillet: 0.07, sf: 0.08, dish: 0.012, wall: 0.1 };
export const CAP_H = CAP.h;
const PLATE_H = 0.15;
const CUTOUT = 1.4; // 14 mm
// top housing above the plate (heights from the plate's top)
const TOP = { base: 1.5, top: 1.2, h: 0.44, ring: 0.33 };
const STEM = { y: 0.66 }; // cross centre above the plate
// the volume knob's height above the plate, and the height of its top in the keyboard's frame
const FRAME_H = 0.65;
const KNOB_H = 1.05; // before the knobs are scaled down to KNOB_R
const KNOB_SCALE = KNOB_R / 1.0;
export const KNOB_TOP_Y = LAYERS.frame.y + FRAME_H / 2 + KNOB_H * KNOB_SCALE;
// each row of caps sits at its own height and angle, so the top of the board forms a shallow bowl
const ROW_RISE = [0.02, 0.02, 0.01, 0, 0, -0.01];
const ROW_TILT = [0.01, 0.03, 0.02, 0, -0.015, -0.025];
const HOVER_LIFT = 0.24; // how far a key rises under the cursor in the hero
const PAD_Y = 0.006; // light pools sit on the plate's face

export const WHITE = new THREE.Color(1.0, 0.9, 0.78);
// warm light-grey caps with orange Esc and arrows
const CAP_TONE: Record<Tone, THREE.Color> = {
  white: new THREE.Color(0xe9e7e1),
  orange: new THREE.Color(0xd9480f),
  dark: new THREE.Color(0x2a2a2c),
};
// the light under the keys: a warm ember, like the cable and the keys that sit on top of it
export const ORANGE = new THREE.Color(1.0, 0.36, 0.06);

// the backlight runs across the board: deep ember at the left, to a warm amber at the right
const RGB_STOPS = [new THREE.Color(1.0, 0.22, 0.04), new THREE.Color(1.0, 0.36, 0.06), new THREE.Color(1.0, 0.52, 0.12), new THREE.Color(1.0, 0.68, 0.28)];
const RGB = KEYS.map((k) => {
  const t = Math.min(0.999, Math.max(0, k.x / (BODY_W - 1.5) + 0.5)) * (RGB_STOPS.length - 1);
  const i = Math.floor(t);
  return RGB_STOPS[i].clone().lerp(RGB_STOPS[i + 1], t - i);
});

// stabilizers: every key 2u or wider (Cherry spacing: 23.8 mm for 2–2.75u, 38.1 mm for 3u)
const STABS = KEYS.map((k) => ({ k, u: (k.w + CAP_GAP) / U }))
  .filter((s) => s.u >= 2)
  .map((s) => ({ ...s, half: (s.u >= 6 ? 10 : s.u >= 3 ? 3.81 : 2.38) / 2 }));

/* ------------------------------------------------------------- geometry */

function rrect<P extends THREE.Path>(p: P, w: number, h: number, r: number, cx = 0, cy = 0): P {
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  p.moveTo(x0 + r, y0);
  p.lineTo(x1 - r, y0);
  p.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  p.lineTo(x1, y1 - r);
  p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  p.lineTo(x0 + r, y1);
  p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x0, y0 + r);
  p.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return p;
}

// A flat rounded slab centred on the origin, lying in XZ. Holes are paths in
// shape space (x, -z) and are grown by the bevel so walls land on their size.
function slab(w: number, d: number, h: number, r: number, bevel = 0, segs = 8, holes: THREE.Path[] = [], bevelSegs = 3) {
  const shape = rrect(new THREE.Shape(), w - 2 * bevel, d - 2 * bevel, Math.max(r - bevel, 0.01));
  shape.holes = holes;
  const depth = h - 2 * bevel;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? bevelSegs : 0,
    curveSegments: segs,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -depth / 2, 0);
  g.computeVertexNormals();
  return g;
}

// mergeGeometries needs every part non-indexed (or every part indexed)
const flat = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);
const merge = (list: THREE.BufferGeometry[]) => mergeGeometries(list)!;

// The KNOB case is a flat slab of even thickness (no typing angle: the feet add that). Everything
// below the slab's middle is pushed down by the same amount, which gives the case its depth.
function wedged(g: THREE.BufferGeometry) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) >= 0) continue;
    p.setY(i, p.getY(i) - 0.0);
  }
  g.computeVertexNormals();
  return g;
}

function flatPlane(w = 1, d = 1) {
  return new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
}

type P2 = [number, number];
type P3 = [number, number, number];

// a rounded-rectangle outline in XZ, the same number of points whatever its size
const PER_CORNER = 5;
function outline(w: number, d: number, r: number): P2[] {
  r = Math.max(0.005, Math.min(r, w / 2 - 1e-3, d / 2 - 1e-3));
  const pts: P2[] = [];
  const cs: P3[] = [
    [w / 2 - r, d / 2 - r, 0],
    [-(w / 2 - r), d / 2 - r, Math.PI / 2],
    [-(w / 2 - r), -(d / 2 - r), Math.PI],
    [w / 2 - r, -(d / 2 - r), Math.PI * 1.5],
  ];
  for (const [cx, cz, a0] of cs) {
    for (let i = 0; i <= PER_CORNER; i++) {
      const a = a0 + (i / PER_CORNER) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  }
  return pts;
}

// Join rings of outline points (all the same length) into a surface, in the
// order given; `out` faces away from the axis (or up, past the last ring),
// otherwise in. A ring may be a single point (a cap on the end).
function loft(rings: P3[][], { out = true } = {}) {
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const starts: number[] = [];
  rings.forEach((ring, r) => {
    starts.push(pos.length / 3);
    ring.forEach(([x, y, z], i) => {
      pos.push(x, y, z);
      uvs.push(i / ring.length, r / (rings.length - 1));
    });
  });
  for (let r = 0; r < rings.length - 1; r++) {
    const A = starts[r];
    const B = starts[r + 1];
    const n = rings[r].length;
    const m = rings[r + 1].length;
    for (let i = 0; i < Math.max(n, m); i++) {
      const a0 = A + (i % n);
      const a1 = A + ((i + 1) % n);
      const b0 = B + (i % m);
      const b1 = B + ((i + 1) % m);
      const tris: P3[] = [];
      if (n > 1) tris.push([a0, b0, a1]);
      if (m > 1) tris.push([a1, b0, b1]);
      for (const [p, q, s] of tris) idx.push(...(out ? [p, q, s] : [p, s, q]));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g.toNonIndexed();
}

const ring = (pts: P2[], y: number, dy: (x: number, z: number) => number = () => 0): P3[] => pts.map(([x, z]) => [x, y + dy(x, z), z]);
const centre = (y: number): P3[] => [[0, y, 0]];

// the keycap's dish: spherical, normalised to its top face
const dishAt = (x: number, z: number, hw: number, hd: number) => CAP.dish * Math.max(0, 1 - (x / hw) ** 2 - (z / hd) ** 2);

// A low-profile keycap, w × d at its foot: a shell that tapers and fillets
// into a dished top, hollow underneath with a cross socket for the stem.
// Centred on its height.
function capGeometry(w: number, d: number) {
  const { h, hs, sf, inset, rBot, rTop, fillet: f, wall } = CAP;
  const wt = w - 2 * inset;
  const dt = d - 2 * inset;
  const rings: P3[][] = [];
  // the base: straight walls, then a soft shoulder rolling in to the plateau
  rings.push(ring(outline(w, d, rBot), 0));
  rings.push(ring(outline(w, d, rBot), hs - sf));
  for (let j = 1; j <= 3; j++) {
    const a = (j / 3) * (Math.PI / 2);
    const s = sf * (1 - Math.cos(a));
    rings.push(ring(outline(w - 2 * s, d - 2 * s, rBot - s), hs - sf + sf * Math.sin(a)));
  }
  // the plateau: nearly straight walls up to its rounded top edge
  rings.push(ring(outline(wt, dt, rTop), hs));
  rings.push(ring(outline(wt, dt, rTop), h - f));
  // the rounded top edge
  for (let j = 1; j <= 3; j++) {
    const a = (j / 3) * (Math.PI / 2);
    const s = f * (1 - Math.cos(a));
    rings.push(ring(outline(wt - 2 * s, dt - 2 * s, rTop - s), h - f + f * Math.sin(a)));
  }
  // the dished face, rings in to the middle
  const fw = wt - 2 * f;
  const fd = dt - 2 * f;
  const face = outline(fw, fd, rTop - f);
  for (let m = 1; m <= 4; m++) {
    const s = 1 - m / 5;
    rings.push(face.map(([x, z]): P3 => [x * s, h - dishAt(x * s, z * s, fw / 2, fd / 2), z * s]));
  }
  rings.push(centre(h - CAP.dish));
  const shell = loft(rings, { out: true });

  // inside: walls, a ceiling, the rim that joins inside to out
  const iw = w - 2 * wall;
  const id = d - 2 * wall;
  const iwt = wt - 2 * wall;
  const idt = dt - 2 * wall;
  const ceil = h - wall - CAP.dish;
  const inner = loft([ring(outline(iw, id, rBot - wall / 2), 0), ring(outline(iwt, idt, rTop - wall / 2), ceil), centre(ceil)], { out: false });
  const rim = loft([ring(outline(w, d, rBot), 0), ring(outline(iw, id, rBot - wall / 2), 0)], { out: false });

  // the stem socket: a boss with a cross-shaped hole, hanging from the ceiling
  const boss = new THREE.Shape().absarc(0, 0, 0.27, 0, Math.PI * 2, false);
  const a = 0.205;
  const b = 0.062;
  const cross = new THREE.Path();
  const crossPts: P2[] = [
    [b, b], [a, b], [a, -b], [b, -b], [b, -a], [-b, -a],
    [-b, -b], [-a, -b], [-a, b], [-b, b], [-b, a], [b, a],
  ];
  crossPts.forEach(([x, y], i) => (i ? cross.lineTo(x, y) : cross.moveTo(x, y)));
  boss.holes.push(cross);
  const socket = new THREE.ExtrudeGeometry(boss, { depth: ceil - 0.06, bevelEnabled: false, curveSegments: 10 });
  socket.rotateX(-Math.PI / 2);
  socket.translate(0, 0.06, 0);

  const g = merge([shell, inner, rim, flat(socket)]);
  g.translate(0, -h / 2, 0);
  return g;
}

// the legend: a fine plane that follows the dish of the cap's face (scaled
// per key to that face, so the dish is in the plane's own unit coordinates)
function legendGeometry() {
  const g = new THREE.PlaneGeometry(1, 1, 10, 10).rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, -dishAt(p.getX(i), p.getZ(i), 0.5, 0.5));
  g.computeVertexNormals();
  return g;
}

// Top housing, from the plate up: a short skirt, tapering walls, a flat top
// with the round dust wall the stem rises through, and the latch clips on
// its sides. Clear polycarbonate (see the housing material). The walls and the
// top are separate surfaces, so the edge between them stays crisp like moulded glass.
function topHousingGeometry() {
  const { base, top, h, ring: rr } = TOP;
  const walls = loft(
    [
      ring(outline(base, base, 0.08), 0),
      ring(outline(base - 0.02, base - 0.02, 0.09), 0.07),
      ring(outline(top + 0.04, top + 0.04, 0.15), h - 0.03),
      ring(outline(top, top, 0.16), h),
    ],
    { out: true },
  );
  const roof = loft([ring(outline(top, top, 0.16), h), ring(outline(top * 0.62, top * 0.62, 0.1), h), centre(h)], { out: true });
  const wallRing = new THREE.CylinderGeometry(rr, rr + 0.01, 0.05, 28, 1, true).translate(0, h + 0.025, 0);
  const lip = new THREE.RingGeometry(rr - 0.05, rr, 28).rotateX(-Math.PI / 2).translate(0, h + 0.05, 0);
  const clips = [-1, 1].flatMap((sx) => [-0.32, 0.32].map((z) => new THREE.BoxGeometry(0.05, 0.12, 0.2).translate(sx * (base / 2 + 0.01), 0.15, z)));
  return merge([walls, roof, flat(wallRing), flat(lip), ...clips.map(flat)]);
}

// bottom housing below the plate, with its centre post and two contact pins
function bottomHousingGeometry() {
  const body = slab(1.38, 1.38, 0.42, 0.06, 0.02, 3, [], 1).translate(0, -0.21, 0);
  const post = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16).translate(0, -0.47, 0);
  const pins = (
    [
      [-0.381, -0.254],
      [0.254, -0.508],
    ] as P2[]
  ).map(([x, z]) => new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6).translate(x, -0.48, z));
  return merge([flat(body), flat(post), ...pins.map(flat)]);
}

// the stem: a body inside the dust wall, and the MX cross the cap grips
function stemGeometry() {
  // a flange under the cross, then a slim shaft and two legs, with room around them
  // for the spring: seen through the clear housing, like a real switch
  const flange = new THREE.BoxGeometry(0.62, 0.09, 0.62).translate(0, -0.16, 0);
  const shaft = new THREE.BoxGeometry(0.2, 0.46, 0.2).translate(0, -0.42, 0);
  const legs = [-1, 1].map((s) => new THREE.BoxGeometry(0.07, 0.3, 0.16).translate(s * 0.27, -0.33, 0));
  return merge([flange, shaft, ...legs, new THREE.BoxGeometry(0.4, 0.26, 0.12), new THREE.BoxGeometry(0.12, 0.26, 0.4)]);
}

// the spring: a steel coil, seen when a switch comes apart
class Coil extends THREE.Curve<THREE.Vector3> {
  turns = 6;
  // (Curve's own constructor is protected in three's types)
  constructor() {
    super();
  }
  override getPoint(t: number, out = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return out.set(Math.cos(a) * 0.2, (t - 0.5) * 0.62, Math.sin(a) * 0.2);
  }
}
function springGeometry() {
  return new THREE.TubeGeometry(new Coil(), 140, 0.024, 5, false);
}

// Stabilizers, from the plate's top face: a housing each side of a long key
// (through the plate), the white insert the cap clips onto, and the steel
// wire that ties the two together along the back.
function stabGeometries() {
  const housings: THREE.BufferGeometry[] = [];
  const inserts: THREE.BufferGeometry[] = [];
  const wires: THREE.BufferGeometry[] = [];
  for (const { k, half } of STABS) {
    for (const s of [-1, 1]) {
      const x = k.x + s * half;
      housings.push(slab(0.62, 1.05, 0.4, 0.06, 0.02, 3, [], 1).translate(x, 0.2, k.z));
      housings.push(new THREE.BoxGeometry(0.6, 0.22, 1.0).translate(x, -0.26, k.z));
      inserts.push(new THREE.BoxGeometry(0.26, 0.34, 0.3).translate(x, 0.52, k.z + 0.05));
      // the wire's bent end, down into the housing
      wires.push(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 8).translate(x, 0.18, k.z - 0.62));
    }
    wires.push(new THREE.CylinderGeometry(0.028, 0.028, half * 2, 8).rotateZ(Math.PI / 2).translate(k.x, 0.08, k.z - 0.62));
  }
  const m = (list: THREE.BufferGeometry[]) => merge(list.map(flat));
  return { housings: m(housings), inserts: m(inserts), wires: m(wires) };
}

/* ------------------------------------------------------------ glow spill */

type SpillUniforms = Record<string, THREE.IUniform>;

// Backlight bounces: the plate and the caps' skirts and undersides pick up
// the glow of the light pools around each switch. A top-down render of the
// lit pools (see renderGlow) is sampled, blurred through its mips, at each
// fragment's position in the keyboard's own frame.
function addSpill(mat: THREE.Material, kind: "FRAME" | "CAP", uniforms: SpillUniforms) {
  mat.defines = { ...(mat.defines ?? {}), [`SPILL_${kind}`]: "" };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uKbInv;\nvarying vec3 vKbPos;\nvarying vec3 vKbNormal;")
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
  mat4 kbM = uKbInv * modelMatrix;
  #ifdef USE_INSTANCING
    kbM = kbM * instanceMatrix;
  #endif
  vKbPos = (kbM * vec4(transformed, 1.0)).xyz;
  vKbNormal = mat3(kbM) * objectNormal;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D glowMap;\nuniform vec2 uGlowSize;\nuniform float uSpill;\nuniform float uCapTop;\nvarying vec3 vKbPos;\nvarying vec3 vKbNormal;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
  {
    vec2 guv = vec2(vKbPos.x / uGlowSize.x + 0.5, 0.5 - vKbPos.z / uGlowSize.y);
    vec3 glow = texture2D(glowMap, guv, 1.0).rgb * 0.55 + texture2D(glowMap, guv, 3.5).rgb * 0.9;
    // smoothstep edges must ascend: reversed edges are undefined in GLSL and
    // come out as NaN on Metal, which bloom then smears over the whole frame
    vec3 kbN = vKbNormal / max(length(vKbNormal), 1e-4);
    float wall = 1.0 - abs(kbN.y);
    #ifdef SPILL_FRAME
      // the plate's face catches the pools; its cutout walls glow brighter
      float f = wall * 0.6 + (1.0 - wall) * 0.12 * step(0.0, kbN.y);
    #else
      // cap skirts and undersides, fading up the skirt and once a cap lifts away
      float f = (wall * 0.6 + max(-kbN.y, 0.0)) * (1.0 - smoothstep(1.4, uCapTop, vKbPos.y));
    #endif
    vec3 spill = glow * uSpill;
    #ifndef SPILL_FRAME
      // never let the glow bleach a cap: it tints the skirt, up to a fixed strength
      spill *= min(1.0, 0.42 / max(max(spill.r, max(spill.g, spill.b)), 1e-3));
    #endif
    totalEmissiveRadiance += spill * f;
  }`,
      );
  };
  mat.customProgramCacheKey = () => `spill-${kind}`;
}

/* -------------------------------------------------------------- builder */

export interface KeyState {
  off: THREE.Vector3;
  q: THREE.Quaternion;
  s: number;
  press: number;
  white: number;
  orange: number;
  parts: number; // shows this key's spring (the switch coming apart)
  inner: number; // scale of this key's switch and light
  led: number; // this key's LED on the logic board (0 off, 1 on)
  hover: number; // 0–1 (springs past 1 briefly): lift under the cursor
  lift: { cap: number; switch: number; spring: number; pad: number };
}
export type KeyPart = "cap" | "switch" | "spring" | "pad";

// the strip display: its canvas texture and a way to redraw what it shows
export interface Screen {
  texture: THREE.Texture;
  // mode 0 clock, 1 minutes picker, 2 timer running; level 0–1 is the pill's place between 5 and 10, or the time left
  draw(mode: number, level: number): void;
}

export interface KeyboardInputs {
  legend: LegendAtlas;
  padTexture: THREE.Texture;
  pcbTexture: THREE.Texture;
  batteryTexture: THREE.Texture;
  surface: SurfaceMaps;
  knobFace: THREE.Texture;
  knobGlow: THREE.Texture;
  softShadow: THREE.Texture;
  display: Screen;
}

export type Keyboard = ReturnType<typeof createKeyboard>;

export function createKeyboard({ legend, padTexture, pcbTexture, batteryTexture, surface, knobFace, knobGlow, softShadow, display }: KeyboardInputs) {
  const root = new THREE.Group();
  const N = KEYS.length;
  const n2 = (v: number) => new THREE.Vector2(v, v);

  const mats = {
    // white: each cap's colour comes from its instance (graphite, or ember for the vibe row)
    // PBT: fine grain, a soft sheen at grazing angles, smudges in the gloss
    cap: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.6,
      sheen: 0.3,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(0.55, 0.53, 0.5),
      envMapIntensity: 1.6,
      normalMap: surface.capNormal,
      normalScale: n2(0.07),
      roughnessMap: surface.capSmudge,
    }),
    // the plate: bead-blasted, anodised aluminium
    frame: new THREE.MeshPhysicalMaterial({
      color: 0x26262c,
      roughness: 0.5,
      metalness: 0.5,
      envMapIntensity: 0.6,
      normalMap: surface.metalNormal,
      normalScale: n2(0.08),
      roughnessMap: surface.smudge,
    }),
    // the top shell: CNC aluminium, anodised silver
    base: new THREE.MeshPhysicalMaterial({
      color: 0xb4b5b1,
      roughness: 0.5,
      metalness: 0,
      // lifts the walls the studio lights miss, so the case reads as silver, not grey-black
      emissive: 0x8a8b87,
      emissiveIntensity: 0.55,
      normalMap: surface.metalNormal,
      normalScale: n2(0.08),
      roughnessMap: surface.smudge,
    }),
    // the bottom shell: the same aluminium, anodised gunmetal
    bottom: new THREE.MeshPhysicalMaterial({
      color: 0x55575a,
      roughness: 0.5,
      metalness: 0,
      emissive: 0x2e3032,
      emissiveIntensity: 0.55,
      normalMap: surface.metalNormal,
      normalScale: n2(0.08),
      roughnessMap: surface.smudge,
    }),
    baseInner: new THREE.MeshStandardMaterial({ color: 0x3e4043, roughness: 0.8, metalness: 0.2 }),
    // matte black anodised aluminium, with a little sheen on the edges
    knob: new THREE.MeshStandardMaterial({ color: 0x38383a, roughness: 0.55, metalness: 0.45, envMapIntensity: 0.7, flatShading: true }),
    // the knob's top: black, with a pale notch so you can see it turn
    knobFace: new THREE.MeshStandardMaterial({ map: knobFace, roughness: 0.4, metalness: 0.5, emissive: 0xffffff, emissiveMap: knobFace, emissiveIntensity: 0.22 }),
    status: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.4, 0.3) }),
    knobWell: new THREE.MeshStandardMaterial({ color: 0x3c3d3f, roughness: 0.55, metalness: 0.5 }),
    knobRing: new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.6, metalness: 0.4 }),
    // the display: a black glass bezel around the screen
    bezel: new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.25, metalness: 0.6, envMapIntensity: 1.2 }),
    // (alphaTest cuts the screen's rounded corners out of its plane)
    screen: new THREE.MeshBasicMaterial({ map: display.texture, toneMapped: false, alphaTest: 0.5 }),
    knobGlow: new THREE.MeshBasicMaterial({ map: knobGlow, transparent: true, depthWrite: false, opacity: 0 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 }),
    port: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    // double-shot legends: lit like the cap, and glowing where the backlight
    // shines through (the per-instance colour drives only the glow)
    legend: new THREE.MeshStandardMaterial({
      map: legend.texture,
      color: 0x8c8c8c, // deep enough that the colours stay rich under bright light
      roughness: 0.55,
      emissive: 0xffffff,
      emissiveMap: legend.texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    // clear polycarbonate top housing: see the patch below for how it reads as glass
    housing: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0,
      ior: 1.6,
      envMapIntensity: 1.8,
      transparent: true,
      // (it writes depth so the depth of field keeps it sharp with the switch: without depth
      // it counts as far background and gets blurred away)
      side: THREE.DoubleSide,
    }),
    housingLow: new THREE.MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.5, metalness: 0.05 }),
    stem: new THREE.MeshStandardMaterial({ color: 0xe8590c, roughness: 0.38, emissive: new THREE.Color(0) }),
    // copper, with a little self-light so it reads against the white studio
    spring: new THREE.MeshStandardMaterial({ color: 0xd09a5c, roughness: 0.3, metalness: 1, emissive: 0x7a5228, emissiveIntensity: 0.8 }),
    window: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    stab: new THREE.MeshStandardMaterial({ color: 0xc9c9c4, roughness: 0.5 }),
    insert: new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.45 }),
    wire: new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.25, metalness: 1 }),
    // latex + IXPE: matte, pale, a little warm
    foam: new THREE.MeshStandardMaterial({
      color: 0x9ea0a8,
      roughness: 1,
      metalness: 0,
      normalMap: surface.capNormal,
      normalScale: n2(0.6),
    }),
    // the light pools the LEDs throw onto the plate around each switch
    pad: new THREE.MeshBasicMaterial({
      map: padTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.22, // only a thread of colour shows in the dark gaps
    }),
    led: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.05, 1.85) }),
    diode: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x86c4b6, roughness: 0.6, metalness: 0.1 }),
    // a mint board, its traces and footprints raised from the hosted board art
    pcbTop: new THREE.MeshStandardMaterial({
      color: 0xa9ddd0,
      roughness: 0.5,
      metalness: 0.05,
      bumpMap: pcbTexture,
      bumpScale: 1.5,
      emissive: 0x6fb5a6,
      emissiveIntensity: 0.35,
    }),
    chip: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.35, metalness: 0.2 }),
    can: new THREE.MeshStandardMaterial({ color: 0xa6a9ad, roughness: 0.3, metalness: 1 }),
    micRing: new THREE.MeshBasicMaterial({ color: ORANGE.clone() }),
    battery: new THREE.MeshStandardMaterial({
      map: batteryTexture,
      roughness: 0.38,
      metalness: 0.75,
      emissive: 0xffffff,
      emissiveMap: batteryTexture,
      emissiveIntensity: 0.12,
    }),
    batteryEdge: new THREE.MeshStandardMaterial({ color: 0x8f9296, roughness: 0.38, metalness: 0.9 }),
  };

  // per-instance uv rect into the legend atlas; instance colour = glow only
  mats.legend.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aUvRect;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvMapUv = aUvRect.xy + uv * aUvRect.zw;\nvEmissiveMapUv = vMapUv;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <color_fragment>", "")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor.rgb;\n#endif");
  };

  // Clear glass: almost nothing on the faces you look straight through, reflections kept at
  // full strength, and edges that turn visible at grazing angles. On a white page glass reads
  // by its darker edges and bright glints, not by any colour of its own.
  mats.housing.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <color_fragment>", "").replace(
      "#include <opaque_fragment>",
      `{
    float glassN = abs(dot(normalize(normal), normalize(vViewPosition)));
    float glassEdge = pow(1.0 - glassN, 2.2);
    float glassGlint = clamp(dot(totalSpecular, vec3(0.3, 0.6, 0.1)), 0.0, 1.0);
    outgoingLight = mix(totalSpecular + vec3(0.24, 0.25, 0.27), vec3(0.4, 0.44, 0.56), glassEdge * 0.75);
    diffuseColor.a = clamp(0.06 + glassEdge * 0.62 + glassGlint * 0.75, 0.0, 0.88);
  }
  #include <opaque_fragment>`,
    );
  };

  // a faint sheen: the rim of the knob lifts a little as it turns away from you
  mats.knob.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
  float knobRim = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
  totalEmissiveRadiance += vec3(0.8, 0.8, 0.82) * (0.0 + pow(knobRim, 3.0) * 0.18);`,
    );
  };

  const spillShared: SpillUniforms = {
    glowMap: { value: null },
    uKbInv: { value: new THREE.Matrix4() },
    uGlowSize: { value: new THREE.Vector2(BODY_W, BODY_D) },
  };
  const spillFrame: SpillUniforms = { ...spillShared, uSpill: { value: 1 }, uCapTop: { value: 1.9 } };
  const spillCap: SpillUniforms = { ...spillShared, uSpill: { value: 3 }, uCapTop: { value: 1.9 } };
  addSpill(mats.frame, "FRAME", spillFrame);
  addSpill(mats.cap, "CAP", spillCap);
  // Coloured caps are lighter on top and deepen down the skirt, as in the product photos. The
  // white caps are left alone (the test on brightness is what tells them apart).
  const spillCompile = mats.cap.onBeforeCompile;
  mats.cap.onBeforeCompile = (sh, r) => {
    spillCompile.call(mats.cap, sh, r);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vCapY;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvCapY = position.y / ${CAP.h.toFixed(3)} + 0.5;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vCapY;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
  if (dot(diffuseColor.rgb, vec3(0.33)) < 0.4) {
    // a dark skirt, then a clearly lighter top face above a crisp edge
    diffuseColor.rgb *= mix(0.62, 0.92, smoothstep(0.0, 0.85, vCapY));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.5 + vec3(0.03, 0.02, 0.02), smoothstep(0.9, 0.95, vCapY));
  } else {
    // white caps shade down the skirt, which leaves room for the backlight's colour to show
    diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.0, 0.5, vCapY));
  }`,
      );
  };

  const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, count: number, { shadow = false } = {}) => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.castShadow = shadow;
    m.receiveShadow = shadow;
    root.add(m);
    return m;
  };

  /* keycaps: one instanced mesh per cap size, so corners never stretch */
  const capRefs: { mesh: THREE.InstancedMesh; slot: number }[] = new Array(N);
  const bySize = new Map<string, { w: number; d: number; keys: number[] }>();
  KEYS.forEach((k, i) => {
    const id = `${k.w.toFixed(3)}x${k.d.toFixed(3)}`;
    if (!bySize.has(id)) bySize.set(id, { w: k.w, d: k.d, keys: [] });
    bySize.get(id)!.keys.push(i);
  });
  const capMeshes: THREE.InstancedMesh[] = [];
  for (const { w, d, keys } of bySize.values()) {
    const mesh = instanced(capGeometry(w, d), mats.cap, keys.length, { shadow: true });
    keys.forEach((ki, slot) => {
      capRefs[ki] = { mesh, slot };
      mesh.setColorAt(slot, CAP_TONE[KEYS[ki].tone]);
    });
    capMeshes.push(mesh);
  }

  const legendGeo = legendGeometry();
  const uvRects = new Float32Array(N * 4);
  legend.rects.forEach((r, i) => uvRects.set(r, i * 4));
  legendGeo.setAttribute("aUvRect", new THREE.InstancedBufferAttribute(uvRects, 4));
  const legendMesh = instanced(legendGeo, mats.legend, N);
  legendMesh.renderOrder = 2;

  /* switches: top housing on the plate, bottom housing through it, stem, spring */
  const housingMesh = instanced(topHousingGeometry(), mats.housing, N);
  housingMesh.renderOrder = 3; // glass draws last, over the light pools
  const lowerMesh = instanced(bottomHousingGeometry(), mats.housingLow, N);
  const stemMesh = instanced(stemGeometry(), mats.stem, N, { shadow: true });
  const springMesh = instanced(springGeometry(), mats.spring, N);
  // the LED window in each top housing, at the back
  const windowMesh = instanced(new THREE.BoxGeometry(0.42, 0.012, 0.16), mats.window, N);
  windowMesh.visible = false; // (the housing is clear glass: no LED window on top)
  KEYS.forEach((_, i) => housingMesh.setColorAt(i, new THREE.Color(0, 0, 0)));

  /* stabilizers under the long keys; they ride with the switch layer */
  const stabs = new THREE.Group();
  const sg = stabGeometries();
  stabs.add(new THREE.Mesh(sg.housings, mats.stab), new THREE.Mesh(sg.inserts, mats.insert), new THREE.Mesh(sg.wires, mats.wire));
  const shadows = (o: THREE.Object3D) => {
    if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true;
  };
  stabs.traverse(shadows);
  root.add(stabs);

  /* light pools on the plate */
  const padMesh = instanced(flatPlane(), mats.pad, N);
  padMesh.renderOrder = 1;
  padMesh.layers.enable(1);

  // top-down view of the lit pools for the spill (layer 1 holds only them)
  const glowRT = new THREE.WebGLRenderTarget(256, Math.round((256 * BODY_D) / BODY_W), {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });
  spillShared.glowMap.value = glowRT.texture;
  const glowCam = new THREE.OrthographicCamera(-BODY_W / 2, BODY_W / 2, BODY_D / 2, -BODY_D / 2, 0.1, 40);
  glowCam.up.set(0, 0, -1);
  glowCam.position.set(0, 20, 0);
  glowCam.lookAt(0, 0, 0);
  glowCam.layers.set(1);
  root.add(glowCam);

  // how deep a key's switch is (the half-height function row gets squat ones)
  const fitOf = (k: Key) => Math.min(1, (k.d + 0.1) / TOP.base);

  /* plate: 1.5 mm aluminium, a 14 mm cutout per switch and two per stabilizer */
  const PW = BODY_W - 1.0;
  const PD = BODY_D - 1.0;
  const plateHoles = [
    ...KEYS.map((k) => rrect(new THREE.Path(), CUTOUT, CUTOUT * fitOf(k), 0.03, k.x, -k.z)),
    ...STABS.flatMap(({ k, half }) => [-1, 1].map((s) => rrect(new THREE.Path(), 0.68, 1.25, 0.05, k.x + s * half, -k.z))),
  ];
  const plateMesh = new THREE.Mesh(slab(PW, PD, PLATE_H, 0.2, 0.02, 5, plateHoles, 1), mats.frame);
  plateMesh.castShadow = plateMesh.receiveShadow = true;
  const plate = new THREE.Group().add(plateMesh);
  /* foam: latex and IXPE between plate and board, cut around every switch */
  const foamHoles = [
    ...KEYS.map((k) => rrect(new THREE.Path(), 1.5, 1.5 * fitOf(k), 0.08, k.x, -k.z)),
    ...STABS.flatMap(({ k, half }) => [-1, 1].map((s) => rrect(new THREE.Path(), 0.72, 1.1, 0.06, k.x + s * half, -k.z))),
  ];
  const foamMesh = new THREE.Mesh(slab(BODY_W - 1.2, BODY_D - 1.2, 0.25, 0.45, 0, 4, foamHoles), mats.foam);
  foamMesh.receiveShadow = true;
  const foam = new THREE.Group().add(foamMesh);

  /* logic board */
  const pcb = new THREE.Group();
  const board = new THREE.Mesh(slab(BODY_W - 1.3, BODY_D - 1.3, 0.16, 0.5, 0.012), mats.pcb);
  const boardTop = new THREE.Mesh(flatPlane(BODY_W - 1.34, BODY_D - 1.34), mats.pcbTop);
  boardTop.position.y = 0.081;
  const chip = new THREE.Mesh(slab(1.6, 1.6, 0.12, 0.1, 0.02), mats.chip);
  chip.position.set(9.6, 0.14, -2.9);
  const usb = new THREE.Mesh(slab(0.9, 0.75, 0.32, 0.12, 0.03), mats.can);
  usb.position.set(BODY_W / 2 - 1.3, 0.24, uZ(1.0));
  pcb.add(board, boardTop, chip, usb);
  // a per-key LED north of each switch (under its LED window), a diode beside it
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.06, 0.14), mats.led, N);
  const diodes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.06, 0.1), mats.diode, N);
  KEYS.forEach((k, i) => {
    leds.setMatrixAt(i, new THREE.Matrix4().makeTranslation(k.x, 0.111, k.z - 0.42 * fitOf(k)));
    leds.setColorAt(i, new THREE.Color(1, 1, 1));
    diodes.setMatrixAt(i, new THREE.Matrix4().makeTranslation(k.x + 0.62, 0.111, k.z + 0.48 * fitOf(k)));
  });
  pcb.add(leds, diodes);
  for (const x of [-1.1, 0, 1.1]) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 28), mats.can);
    can.position.set(x, 0.13, -4.25);
    const micRing = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.13, 28).rotateX(-Math.PI / 2), mats.micRing);
    micRing.position.set(x, 0.182, -4.25);
    pcb.add(can, micRing);
  }
  pcb.traverse(shadows);

  /* battery: one sealed lithium-ion cell */
  const battery = new THREE.Group();
  {
    const cell = new THREE.Mesh(slab(21, 4.2, 0.2, 0.3, 0.035), mats.batteryEdge);
    cell.position.set(0, 0, -1.4);
    const label = new THREE.Mesh(flatPlane(20.6, 3.9), mats.battery);
    label.position.set(0, 0.101, -1.4);
    battery.add(cell, label);
  }
  battery.traverse(shadows);

  /* case: a machined aluminium tray the stack drops into, on rubber feet,
     with the USB-C port in its back wall */
  const base = new THREE.Group();
  const CASE_H = 0.7;
  const walls = new THREE.Mesh(wedged(slab(BODY_W, BODY_D, CASE_H, 0.4, 0.045, 8, [rrect(new THREE.Path(), BODY_W - 0.9, BODY_D - 0.9, 0.2)], 3)), mats.bottom);
  const floor = new THREE.Mesh(wedged(slab(BODY_W - 0.4, BODY_D - 0.4, 0.15, 0.3, 0)), mats.baseInner);
  floor.position.y = -CASE_H / 2 + 0.075;
  base.add(walls, floor);
  const port = new THREE.Mesh(new THREE.ShapeGeometry(rrect(new THREE.Shape(), 0.95, 0.34, 0.17), 6), mats.port);
  port.rotation.y = Math.PI / 2;
  port.position.set(BODY_W / 2 + 0.004, 0.55 - LAYERS.base.y, uZ(1.0));
  base.add(port);
  base.traverse((o) => o !== port && shadows(o));

  // the top case: a white plate with a dark recessed window for each cluster of keys
  const windows = WINDOWS.map((corners) => {
    const path = new THREE.Path();
    const inset = 0.07; // a dark line of shadow around every cluster
    const cx = corners.reduce((n, c) => n + c[0], 0) / corners.length;
    const cz = corners.reduce((n, c) => n + c[1], 0) / corners.length;
    corners.forEach(([u, v], i) => {
      const x = uX(u) + (u < cx ? -inset : inset);
      const y = -(uZ(v) + (v < cz ? -inset : inset));
      if (i) path.lineTo(x, y);
      else path.moveTo(x, y);
    });
    path.closePath();
    return path;
  });
  const frame = new THREE.Group().add(new THREE.Mesh(slab(BODY_W, BODY_D, FRAME_H, 0.4, 0.03, 8, windows, 2), mats.base));
  frame.traverse(shadows);
  // Put together, the two case halves read as one solid shell with no seam, so a single piece
  // covers them until the keyboard starts to come apart.
  const shell = new THREE.Mesh(wedged(slab(BODY_W, BODY_D, CASE_H + FRAME_H, 0.4, 0.05, 8, [rrect(new THREE.Path(), BODY_W - 0.9, BODY_D - 0.9, 0.2)], 3)), mats.base);
  shell.position.y = (CASE_H + FRAME_H) / 2;
  shell.castShadow = true;
  root.add(shell);
  // a soft shadow under the wedge, so the white case has an edge against the white page
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(BODY_W * 1.3, BODY_D * 1.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: softShadow, transparent: true, depthWrite: false, opacity: 0.62 }));
  ground.position.set(0, -0.5, 0.3);
  ground.renderOrder = -1;
  root.add(ground);
  // KNOB's dials: a short dark cylinder, knurled all the way round with sharp vertical ribs, and
  // a flat top. The ribs are a zig-zag outline, extruded to the dial's height.
  const RIBS = 44;
  const knurl = new THREE.Shape();
  for (let i = 0; i < RIBS * 2; i++) {
    const a = (i / (RIBS * 2)) * Math.PI * 2;
    const r = i % 2 ? 0.925 : 1.0;
    if (i) knurl.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else knurl.moveTo(r, 0);
  }
  knurl.closePath();
  const knobGeo = new THREE.ExtrudeGeometry(knurl, { depth: KNOB_H, bevelEnabled: false, curveSegments: 1 });
  knobGeo.rotateX(-Math.PI / 2);
  const knobTopGeo = new THREE.CircleGeometry(0.915, 64).rotateX(-Math.PI / 2).translate(0, KNOB_H, 0);
  const flatRing = (inner: number, outer: number, mat: THREE.Material, y: number) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96).rotateX(-Math.PI / 2), mat);
    m.position.y = y;
    return m;
  };
  mats.knobWell.polygonOffset = mats.knobRing.polygonOffset = true;
  mats.knobWell.polygonOffsetFactor = mats.knobRing.polygonOffsetFactor = -2;
  const knobSpins: THREE.Group[] = [];
  for (const pos of KNOBS) {
    const knob = new THREE.Mesh(knobGeo, mats.knob);
    const knobTop = new THREE.Mesh(knobTopGeo, mats.knobFace);
    knobTop.position.y = 0.003;
    knob.castShadow = knob.receiveShadow = true;
    const glowDisc = new THREE.Mesh(flatPlane(4.2, 4.2), mats.knobGlow);
    glowDisc.position.y = 0.004;
    glowDisc.renderOrder = 1;
    glowDisc.visible = false; // the real knobs have no glow
    const spin = new THREE.Group().add(knob, knobTop);
    const group = new THREE.Group().add(spin, glowDisc, flatRing(0.98, 1.12, mats.knobWell, 0.008), flatRing(1.12, 1.18, mats.knobRing, 0.01));
    group.scale.setScalar(KNOB_SCALE);
    group.position.set(pos.x, FRAME_H / 2, pos.z);
    frame.add(group);
    knobSpins.push(spin);
  }

  // the display strip: a black glass bezel with the screen set into it
  const BEZEL = 0.2;
  const SCREEN_R = 0.7; // cm: the screen's corner radius (the canvas clips to the same, see textures.ts)
  // (the bezel's corner radius is the screen's plus the bezel width, so the two curves are concentric)
  const bezel = new THREE.Mesh(slab(DISPLAY.w + BEZEL * 2, DISPLAY.d + BEZEL * 2, 0.16, SCREEN_R + BEZEL, 0.03, 10, [], 2), mats.bezel);
  bezel.position.set(DISPLAY.x, FRAME_H / 2 + 0.01, DISPLAY.z);
  bezel.castShadow = true;
  const screen = new THREE.Mesh(flatPlane(DISPLAY.w, DISPLAY.d), mats.screen);
  screen.position.set(DISPLAY.x, FRAME_H / 2 + 0.096, DISPLAY.z);
  frame.add(bezel, screen);

  const layerGroups = { frame, plate, foam, pcb, battery, base };
  for (const [name, g] of Object.entries(layerGroups) as [keyof typeof layerGroups, THREE.Group][]) {
    g.position.y = LAYERS[name].y;
    root.add(g);
  }

  /* --------------------------------------------------------- live state */

  // Everything that animates is plain data written by the intro / scroll
  // timelines; update() turns it into instance matrices once per frame.
  const keys: KeyState[] = KEYS.map(() => ({
    off: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    s: 1,
    press: 0,
    white: 0,
    orange: 0,
    parts: 0,
    inner: 1,
    led: 1,
    hover: 0,
    lift: { cap: 0, switch: 0, spring: 0, pad: 0 },
  }));
  const explode: Record<LayerName, number> = { caps: 0, switch: 0, frame: 0, plate: 0, foam: 0, pcb: 0, battery: 0, base: 0 };
  // sideways offset (cm, along the keyboard's length) of the lower layers:
  // the preloader starts on the logic board slid out from under the keys
  const slide = { pcb: 0, battery: 0, base: 0 };
  // capGlowTop: how high up a cap's skirt the backlight reaches
  // knobTurn: the volume knob's rotation in the scroll story; knobHover: its extra rotation
  // under the cursor; knobGlow: how brightly its halo shows (0–1); knobLift: extra glow on hover
  // screen/screenLevel: what the display shows (see textures.ts → createDisplay)
  const look = { legendGlow: 0.3, mic: 0, capGlowTop: 1.56, knobTurn: 0, knobHover: 0, knobGlow: 0.6, knobLift: 0, screen: 0, screenLevel: 0 };
  const shown = { mode: 0, level: 0 };

  // no two caps sit perfectly level
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
  const jitter = KEYS.map(() => ({
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 0.009, 0, rnd() * 0.009)),
    y: rnd() * 0.008,
  }));
  const qj = new THREE.Quaternion();
  const rowTilt = ROW_TILT.map((a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a));

  const m = new THREE.Matrix4();
  const m2 = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const qI = new THREE.Quaternion();
  const col = new THREE.Color();
  const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
  const faceInset = CAP.inset + CAP.fillet;

  // caps peel away row by row, back row first
  const capLift = (row: number) => easeIO(clamp01(explode.caps * 1.45 - row * 0.09));
  const capLiftOf = (i: number) => capLift(KEYS[i].row);
  const switchY = () => LAYERS.switch.y + LAYERS.switch.lift * explode.switch;
  const plateTop = () => LAYERS.plate.y + LAYERS.plate.lift * explode.plate + PLATE_H / 2;

  const animated = [...capMeshes, legendMesh, housingMesh, lowerMesh, windowMesh, stemMesh, springMesh, padMesh];

  function update() {
    let orangeSum = 0;
    const swBase = switchY();
    const padBase = plateTop() + PAD_Y;
    for (let i = 0; i < N; i++) {
      const k = KEYS[i];
      const st = keys[i];
      const fit = fitOf(k);

      // cap + legend
      const capY = LAYERS.caps.y + ROW_RISE[k.row] + LAYERS.caps.lift * capLift(k.row) + st.lift.cap - st.press + st.hover * HOVER_LIFT;
      p.set(k.x + st.off.x, capY + st.off.y + jitter[i].y, k.z + st.off.z);
      s.setScalar(st.s);
      m.compose(p, qj.copy(st.q).multiply(rowTilt[k.row]).multiply(jitter[i].q), s);
      capRefs[i].mesh.setMatrixAt(capRefs[i].slot, m);
      // the legend fills the cap's dished face
      m2.makeScale(k.w - 2 * faceInset, 1, k.d - 2 * faceInset).setPosition(0, CAP_H / 2 + 0.014, 0);
      m2.premultiply(m);
      legendMesh.setMatrixAt(i, m2);

      const g = clamp01(st.orange * 0.75) * look.legendGlow;
      col.copy(RGB[i]).multiplyScalar(g * 2.4);
      if (k.tone !== "white") col.addScalar(0.8); // legends on coloured caps light up from within
      legendMesh.setColorAt(i, col);

      // switch: housings, LED window, the stem riding down with the cap, and
      // the spring (only while the switch is apart)
      const swY = swBase + st.lift.switch;
      p.set(k.x, swY, k.z);
      s.set(st.inner, st.inner, fit * st.inner);
      m.compose(p, qI, s);
      housingMesh.setMatrixAt(i, m);
      lowerMesh.setMatrixAt(i, m);
      col.copy(ORANGE).multiplyScalar(0.01 + Math.min(st.orange, 1.6) * 0.075);
      housingMesh.setColorAt(i, col);
      p.set(k.x, swY + TOP.h + 0.004, k.z - 0.4 * fit);
      m.compose(p, qI, s);
      windowMesh.setMatrixAt(i, m);
      col.copy(ORANGE).multiplyScalar(0.2 + Math.min(st.orange, 1.6) * 1.1);
      windowMesh.setColorAt(i, col);
      p.set(k.x, swY + STEM.y - Math.min(st.press, 0.25), k.z);
      s.set(st.inner, st.inner, st.inner);
      m.compose(p, qI, s);
      stemMesh.setMatrixAt(i, m);
      p.set(k.x, swBase + 0.2 + st.lift.spring, k.z);
      s.setScalar(Math.max(st.parts, 0.7) * st.inner);
      m.compose(p, qI, s);
      springMesh.setMatrixAt(i, m);

      // light pool on the plate
      p.set(k.x, padBase + st.lift.pad, k.z);
      s.set(k.w * 1.06 * st.inner, 1, k.d * 1.1 * st.inner);
      m.compose(p, qI, s);
      padMesh.setMatrixAt(i, m);
      col.setRGB(WHITE.r * st.white + RGB[i].r * st.orange, WHITE.g * st.white + RGB[i].g * st.orange, WHITE.b * st.white + RGB[i].b * st.orange);
      padMesh.setColorAt(i, col);
      orangeSum += st.orange;
    }

    for (const mesh of animated) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor && mesh.material !== mats.cap) mesh.instanceColor.needsUpdate = true;
    }
    stabs.position.y = swBase;
    knobSpins[0].rotation.y = look.knobTurn + look.knobHover;
    knobSpins[1].rotation.y = -(look.knobTurn + look.knobHover) * 0.6;
    if (look.screen !== shown.mode || Math.abs(look.screenLevel - shown.level) > 0.003) {
      shown.mode = look.screen;
      shown.level = look.screenLevel;
      display.draw(shown.mode, shown.level);
    }
    mats.knobGlow.opacity = Math.min(1, look.knobGlow + look.knobLift * 0.4);

    for (const [name, grp] of Object.entries(layerGroups) as [keyof typeof layerGroups, THREE.Group][]) {
      grp.position.y = LAYERS[name].y + LAYERS[name].lift * explode[name];
      grp.position.x = name in slide ? slide[name as keyof typeof slide] : 0;
    }
    let ledsOn = true;
    for (let i = 0; i < N; i++) {
      const v = keys[i].led;
      if (v !== 1) ledsOn = false;
      leds.setColorAt(i, col.setScalar(v));
    }
    if (!ledsOn || leds.userData.wasDimmed) leds.instanceColor!.needsUpdate = true;
    leds.userData.wasDimmed = !ledsOn;

    const glowMean = orangeSum / N;
    mats.stem.emissive.copy(ORANGE).multiplyScalar(0.03 + glowMean * 0.12);
    mats.micRing.color.copy(ORANGE).multiplyScalar(0.5 + look.mic * 4);
    // assembled, the foam, board, battery and switch bottoms are sealed inside
    // the case: skip drawing them (they come back as soon as anything moves)
    const sealed = explode.switch + explode.frame + explode.plate + explode.foam + explode.pcb + explode.battery + explode.base < 1e-4 && slide.pcb === 0 && slide.base === 0;
    pcb.visible = battery.visible = !sealed;
    foam.visible = false; // the real board has no foam layer
    shell.visible = false; // (the two-tone shells meet at a seam; a single shell would z-fight them)
    ground.visible = explode.frame + explode.base < 1e-4 && slide.base === 0;
    lowerMesh.visible = !sealed || keys.some((k) => k.lift.switch > 1e-3);
    spillFrame.uSpill.value = 0.5;
    spillCap.uCapTop.value = look.capGlowTop;
  }

  // call once per frame, before the main render; the glow changes slowly, so
  // the top-down view is only redrawn every other frame
  let glowFrame = 0;
  function renderGlow(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    (spillShared.uKbInv.value as THREE.Matrix4).copy(root.matrixWorld).invert();
    if (glowFrame++ % 2) return;
    const auto = renderer.shadowMap.autoUpdate;
    const target = renderer.getRenderTarget();
    renderer.shadowMap.autoUpdate = false;
    // (the pools are drawn dim on screen, but at full strength for the light they throw)
    const dim = mats.pad.opacity;
    mats.pad.opacity = 1;
    renderer.setRenderTarget(glowRT);
    renderer.clear();
    renderer.render(scene, glowCam);
    renderer.setRenderTarget(target);
    mats.pad.opacity = dim;
    renderer.shadowMap.autoUpdate = auto;
  }

  // world-space corners of a layer at its current height, for label anchors
  const corners = [0, 1, 2, 3].map(() => new THREE.Vector3());
  const layerCorners = (name: LayerName) => {
    const y =
      name === "caps"
        ? LAYERS.caps.y + LAYERS.caps.lift * capLift(5)
        : name === "switch"
          ? switchY() + TOP.h / 2
          : LAYERS[name].y + LAYERS[name].lift * explode[name];
    const hx = BODY_W / 2 - 0.4;
    const hz = BODY_D / 2 - 0.5;
    corners[0].set(-hx, y, hz);
    corners[1].set(-hx, y, -hz);
    corners[2].set(hx, y, hz);
    corners[3].set(hx, y, -hz);
    for (const c of corners) root.localToWorld(c);
    return corners;
  };

  // world-space centre of one key's parts
  const keyPart = (i: number, part: KeyPart, out: THREE.Vector3) => {
    const k = KEYS[i];
    const st = keys[i];
    let y: number;
    if (part === "cap") y = LAYERS.caps.y + LAYERS.caps.lift * capLiftOf(i) + st.lift.cap - st.press + CAP_H / 2;
    else if (part === "switch") y = switchY() + st.lift.switch + TOP.h / 2;
    else if (part === "spring") y = switchY() + 0.2 + st.lift.spring;
    else y = plateTop() + PAD_Y + st.lift.pad;
    out.set(k.x + st.off.x, y + st.off.y, k.z + st.off.z);
    return root.localToWorld(out);
  };

  function dispose() {
    glowRT.dispose();
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      if (o instanceof THREE.InstancedMesh) o.dispose();
    });
    for (const mat of Object.values(mats)) mat.dispose();
  }

  update();
  return { root, keys, explode, slide, look, update, renderGlow, layerCorners, keyPart, mats, dispose };
}
