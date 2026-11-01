// KNOB layout, read from the top-down product photo. Units are centimetres; one key unit (u) is a
// 19 mm pitch. Positions below are in u from the top-left key. A 15u main block with a wide Esc
// and Del, an orange arrow cluster that reaches out under the right-hand column, and in that
// column two stacked knobs over a tall display.

export const U = 1.9;
export const CAP_GAP = 0.1; // pitch minus cap size: the caps nearly touch at the skirt
export const WELL_PAD = 0.07; // clearance between a cap and its well wall
export const MARGIN_X = 0.76;
export const MARGIN_Z = 0.8;

export type VibeKind = "prompt" | "talk" | "reject" | "accept";
export type ArrowDir = "left" | "up" | "down" | "right" | "enter";
export type Tone = "white" | "orange" | "dark";

// What's printed on a cap (see textures.ts → drawAtlas): one centred glyph,
// a pair side by side, a small word, an arrow, or the space bar's light line.
export interface Legend {
  c?: string;
  t?: string;
  b?: string;
  s?: string;
  arrow?: ArrowDir;
  spacebar?: boolean;
}

export interface Key {
  id: string;
  index: number;
  row: number;
  x: number;
  z: number;
  w: number;
  d: number;
  wellW: number;
  wellD: number;
  legend: Legend;
  tone: Tone;
  vibe: VibeKind | null;
}

// a key may fix its own column (x, in u) and drop below its row (dv, in u)
type KeyDef = [id: string, width: number, legend: Legend, at?: { x?: number; dv?: number }];
const L = (c: string): Legend => ({ c });
const N = (t: string, b: string): Legend => ({ t, b });
const word = (s: string): Legend => ({ s });

const ROW_V = [0.5, 1.8, 2.8, 3.8, 4.8, 5.8]; // row centres, from the top edge of the F row
const WIDE = 16.5;
const DEEP = 6.55;

const ROWS: KeyDef[][] = [
  [
    ["esc", 1.5, word("esc")],
    ...Array.from({ length: 12 }, (_, i): KeyDef => [`F${i + 1}`, 1, L(`F${i + 1}`)]),
    ["del", 1.5, word("del")],
  ],
  [
    ["`", 1, N("~", "`")],
    ["1", 1, N("!", "1")],
    ["2", 1, N("@", "2")],
    ["3", 1, N("#", "3")],
    ["4", 1, N("$", "4")],
    ["5", 1, N("%", "5")],
    ["6", 1, N("^", "6")],
    ["7", 1, N("&", "7")],
    ["8", 1, N("*", "8")],
    ["9", 1, N("(", "9")],
    ["0", 1, N(")", "0")],
    ["-", 1, N("_", "-")],
    ["=", 1, N("+", "=")],
    ["backspace", 2, word("backspace")],
  ],
  [
    ["tab", 1.5, word("tab")],
    ..."QWERTYUIOP".split("").map((k): KeyDef => [k, 1, L(k)]),
    ["[", 1, N("{", "[")],
    ["]", 1, N("}", "]")],
    ["\\", 1.5, N("|", "\\")],
  ],
  [
    ["caps", 1.75, word("caps")],
    ..."ASDFGHJKL".split("").map((k): KeyDef => [k, 1, L(k)]),
    [";", 1, N(":", ";")],
    ["'", 1, N('"', "'")],
    ["enter", 2.25, { arrow: "enter" }],
  ],
  [
    ["shift", 2.25, word("shift")],
    ..."ZXCVBNM".split("").map((k): KeyDef => [k, 1, L(k)]),
    [",", 1, N("<", ",")],
    [".", 1, N(">", ".")],
    ["/", 1, N("?", "/")],
    ["rshift", 1.75, word("shift")],
    ["up", 1, { arrow: "up" }],
  ],
  [
    ["ctrl", 1.25, word("ctrl")],
    ["win", 1.25, word("cmd")],
    ["alt", 1.25, word("alt")],
    ["space", 7.25, {}],
    ["ralt", 1, word("alt")],
    ["fn", 1, word("fn")],
    ["left", 1, { arrow: "left" }],
    ["down", 1, { arrow: "down" }],
    ["right", 1, { arrow: "right" }],
  ],
];

// warm light-grey caps; Esc and the arrow cluster in orange
const ORANGE_KEYS = new Set(["esc", "up", "left", "down", "right"]);
const toneOf = (id: string): Tone => (ORANGE_KEYS.has(id) ? "orange" : "white");

export const BODY_W = WIDE * U + MARGIN_X * 2;
export const BODY_D = DEEP * U + MARGIN_Z * 2;

// from layout units to centimetres in the keyboard's own frame
export const uX = (u: number) => (u - WIDE / 2) * U;
export const uZ = (v: number) => (v - DEEP / 2) * U;

// the two stacked knobs and the display strip in the right-hand column
export const KNOB_R = 0.74; // knob radius, cm
export const KNOBS = [
  { x: uX(15.72), z: uZ(0.42) },
  { x: uX(15.72), z: uZ(1.27) },
];
// the camera's mark for "the knobs": the point between them
export const KNOB = { x: KNOBS[0].x, z: (KNOBS[0].z + KNOBS[1].z) / 2 };
export const DISPLAY = { x: uX(15.72), z: uZ(3.2), w: 1.0 * U, d: 2.55 * U };

// the recessed window in the top case: one opening for the whole key field, which steps out to
// the right along the bottom for the arrow cluster
export const WINDOWS: [number, number][][] = [[[0, 0], [15, 0], [15, 5.3], [16, 5.3], [16, 6.3], [0, 6.3]]];

// Flattened key list with centres (x, z), cap size (w, d) and well size.
export const KEYS: Key[] = (() => {
  const keys: Key[] = [];
  ROWS.forEach((row, r) => {
    let u = 0;
    for (const [id, w, legend, at] of row) {
      if (at?.x !== undefined) u = at.x;
      if (id !== "_") {
        const capW = w * U - CAP_GAP;
        const capD = U - CAP_GAP;
        keys.push({
          id,
          index: keys.length,
          row: r,
          x: uX(u + w / 2),
          z: uZ(ROW_V[r] + (at?.dv ?? 0)),
          w: capW,
          d: capD,
          wellW: capW + WELL_PAD * 2,
          wellD: capD + WELL_PAD * 2,
          legend,
          tone: toneOf(id),
          vibe: null,
        });
      }
      u += w;
    }
  });
  return keys;
})();

const indexOf = (id: string) => KEYS.findIndex((k) => k.id === id);
// the home row, which the scroll story frames; and the key that comes apart into its parts (the
// orange Esc, in the corner, so its labels have the open board to their right)
export const VIBE = KEYS.filter((k) => k.row === 3).map((k) => k.index);
export const ACCEPT_INDEX = indexOf("esc");
