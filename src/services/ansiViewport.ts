// Viewport windowing for ANSI half-block image renders. Kept in its own module
// (no dependency on imageRenderer) so tests exercise the real functions even when
// imageRenderer is mocked elsewhere.

// Strip ANSI escape codes to measure actual display width.
function stripAnsi(str: string): string {
  // Match all ANSI escape sequences including OSC, CSI, etc.
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*\x07)/g, '');
}

// Measure the visible dimensions of an ANSI half-block render (escape codes excluded).
export function measureAnsiImage(image: string): { cols: number; rows: number } {
  if (image === '') return { cols: 0, rows: 0 };
  const lines = image.split('\n');
  return { rows: lines.length, cols: Math.max(...lines.map(line => stripAnsi(line).length)) };
}

// eslint-disable-next-line no-control-regex
const SGR = /^\x1B\[[0-9;]*m/;

// Extract visible columns [offX, offX + winW) from a single ANSI line, preserving
// the SGR (color) state active at the window's left edge. Codes before the window
// are folded into `activeBefore` and re-emitted at the front; codes inside the
// window are kept inline. A trailing reset prevents color bleeding past the slice.
function sliceAnsiColumns(line: string, offX: number, winW: number): string {
  if (winW <= 0) return '';
  const end = offX + winW;
  let i = 0;
  let col = 0;
  let activeBefore = '';
  let body = '';
  let started = false;

  while (i < line.length && col < end) {
    const rest = line.slice(i);
    const m = rest.match(SGR);
    if (m) {
      const code = m[0];
      if (col < offX) {
        // Before window: track state (a reset clears it).
        activeBefore = code === '\x1B[0m' || code === '\x1B[m' ? '' : activeBefore + code;
      } else {
        body += code; // Inside window: keep inline.
      }
      i += code.length;
      continue;
    }
    const cp = rest.codePointAt(0)!;
    const ch = String.fromCodePoint(cp);
    if (col >= offX) {
      body += ch;
      started = true;
    }
    col++;
    i += ch.length;
  }

  if (!started) return '';
  const suffix = activeBefore || body.includes('\x1B[') ? '\x1B[0m' : '';
  return activeBefore + body + suffix;
}

// Slice a winW x winH viewport out of an oversized ANSI render at offset
// (offX, offY). Rows slice trivially; columns are SGR-aware (see sliceAnsiColumns).
export function sliceAnsiViewport(
  image: string,
  offX: number,
  offY: number,
  winW: number,
  winH: number
): string {
  if (winW <= 0 || winH <= 0) return '';
  return image
    .split('\n')
    .slice(offY, offY + winH)
    .map(line => sliceAnsiColumns(line, offX, winW))
    .join('\n');
}
