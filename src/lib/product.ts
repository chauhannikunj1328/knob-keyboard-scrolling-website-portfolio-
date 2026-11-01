// What the KNOB page says. The facts (name, price, layouts, platforms, the two knobs and the
// display, the timer) come from the product's own launch images; the marketing lines are written
// for this portfolio concept. Anything the images don't state is left out rather than made up.

export const PRICE = "$439";
export const BRAND = "KNOB";
export const MAKER = "by Work Louder";

// 3D stills of the model on the page (see the dev-only window.__still in lib/stage.ts)
export const GALLERY: { src: string; alt: string }[] = [
  { src: "/product/knob-angle.jpg", alt: "KNOB keyboard at an angle: light grey keycaps, orange Esc and arrow keys, two knobs and a display on the right" },
  { src: "/product/knob-top.jpg", alt: "KNOB keyboard from directly above" },
  { src: "/product/knob-corner.jpg", alt: "Close-up of the two knurled knobs, the display showing 9:00, and the orange arrow keys" },
  { src: "/product/knob-end.jpg", alt: "The right-hand end of the keyboard, with the USB-C port in the side of the aluminium case" },
];

export const BANNERS: { src: string; alt: string }[] = [
  { src: "/product/knob-exploded.jpg", alt: "The keyboard's layers, taken apart" },
  { src: "/product/knob-orange.jpg", alt: "The orange Esc key above the light grey keys" },
];

export const CHIPS = ["Two knobs", "Live display", "ISO // ANSI", "PC // Mac // Bluetooth"];

export const BULLETS: [string, string][] = [
  ["Two knobs", "Stacked in the top corner: switch modes with one, set the value with the other."],
  ["A display of its own", "A tall screen beside the keys. It shows the clock, then a timer when you turn a knob."],
  ["ISO or ANSI", "Both layouts, so the keys are where your hands expect them."],
  ["PC, Mac, Bluetooth", "Works with your computers, wired or wireless."],
];

export const TIMER_STEPS: [string, string][] = [
  ["I", "FN + turn a knob to switch modes"],
  ["II", "Turn to change the time. FN twice to select"],
  ["III", "The timer starts"],
  ["IV", "It ticks down and the shape shrinks"],
  ["V", "The timer ends, with extra options"],
];

export const SPECS: [string, [string, string][]][] = [
  [
    "At a glance",
    [
      ["Name", "KNOB by Work Louder"],
      ["Case", "CNC aluminium: anodised silver top, gunmetal bottom"],
      ["Controls", "Two rotary dials above a vertical colour display"],
      ["Display", "100 × 310 px IPS, not touch"],
      ["Accent", "Orange Esc and arrow keys, orange cable"],
      ["Layouts", "ISO and ANSI"],
    ],
  ],
  [
    "Works with",
    [
      ["Systems", "Mac, iOS, Windows and Android"],
      ["Connection", "Bluetooth LE, or USB-C with a braided cable"],
      ["Battery", "Sealed lithium-ion"],
    ],
  ],
  [
    "Availability",
    [
      ["Pre-order price", PRICE],
      ["Shipping", "Fall"],
      ["Switches", "Low-profile, 55 g, hot-swap, regular MX stem"],
      ["In the box", "Cable, two spare dials, key puller"],
      ["Note", "Reviews disagree on a few details, so some are left out"],
    ],
  ],
];
