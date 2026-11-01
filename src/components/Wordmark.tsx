// A drawn stand-in for the KNOB logotype: thin, squared letters, with a small tick over the O.
// Swap this one file for the real logo's SVG when there is one.
export function Wordmark({ height = 20 }: { height?: number }) {
  return (
    <svg viewBox="0 0 94 28" height={height} role="img" aria-label="KNOB" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M2 6V26M17 6L2 17M7 14L17 26" />
      <path d="M27 26V6L42 26V6" />
      <path d="M53 6H63Q70 6 70 13V19Q70 26 63 26H53Q50 26 50 23V9Q50 6 53 6Z" />
      <path d="M57 1L63 -0.5" strokeWidth="1.6" />
      <path d="M80 6V26H88Q92 26 92 21.500Q92 16.500 88 16.500H80M80 16.500H87Q91 16.500 91 11.500Q91 6 87 6H80" />
    </svg>
  );
}
