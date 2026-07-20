import { describe, it, expect } from "bun:test";
import { measureAnsiImage, sliceAnsiViewport } from "./ansiViewport.js";

const RED = "\x1B[31m";
const GREEN = "\x1B[32m";
const RESET = "\x1B[0m";

describe("measureAnsiImage", () => {
  it("returns zero dims for empty input", () => {
    expect(measureAnsiImage("")).toEqual({ cols: 0, rows: 0 });
  });

  it("measures visible width, ignoring ANSI escapes", () => {
    const line = `${RED}abcde${RESET}`;
    expect(measureAnsiImage(line)).toEqual({ cols: 5, rows: 1 });
  });

  it("uses the widest line and counts rows", () => {
    const img = `${RED}ab${RESET}\n${GREEN}abcd${RESET}\nx`;
    expect(measureAnsiImage(img)).toEqual({ cols: 4, rows: 3 });
  });
});

describe("sliceAnsiViewport", () => {
  it("returns empty for a zero-size window", () => {
    expect(sliceAnsiViewport("abc", 0, 0, 0, 1)).toBe("");
    expect(sliceAnsiViewport("abc", 0, 0, 3, 0)).toBe("");
  });

  it("slices rows by offset and height", () => {
    const img = "row0\nrow1\nrow2\nrow3";
    expect(sliceAnsiViewport(img, 0, 1, 4, 2)).toBe("row1\nrow2");
  });

  it("slices columns by visible width", () => {
    expect(sliceAnsiViewport("abcdef", 2, 0, 3, 1)).toBe("cde");
  });

  it("preserves color state active at the window's left edge", () => {
    // Whole line is red; window starts mid-line, so red must be re-emitted.
    const line = `${RED}abcdef${RESET}`;
    const out = sliceAnsiViewport(line, 2, 0, 2, 1);
    expect(out).toBe(`${RED}cd${RESET}`);
  });

  it("keeps color changes that occur inside the window", () => {
    const line = `${RED}ab${GREEN}cd${RESET}`;
    const out = sliceAnsiViewport(line, 1, 0, 2, 1);
    // Column 1 is 'b' (red active), column 2 is 'c' (green starts here).
    expect(out).toBe(`${RED}b${GREEN}c${RESET}`);
  });

  it("truncates cleanly when the window extends past the line end", () => {
    expect(sliceAnsiViewport("abc", 1, 0, 10, 1)).toBe("bc");
  });

  it("is an identity-ish slice for a full plain-text window", () => {
    expect(sliceAnsiViewport("abcde", 0, 0, 5, 1)).toBe("abcde");
  });
});
