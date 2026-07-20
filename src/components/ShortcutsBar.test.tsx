import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { ShortcutsBar } from "./ShortcutsBar";
import { SkinContext } from "./ui/SkinContext";

describe("ShortcutsBar", () => {
  it("renders the shortcut legend", () => {
    const frame = render(<ShortcutsBar />).lastFrame() ?? "";
    expect(frame).toContain("m minimal");
    expect(frame).toContain("c colors");
    expect(frame).toContain("Tab cycle");
  });

  it("renders a rule and the accent glyph above the legend under the claudeCode skin", () => {
    const frame =
      render(
        <SkinContext.Provider value="claudeCode">
          <ShortcutsBar />
        </SkinContext.Provider>,
      ).lastFrame() ?? "";
    expect(frame).toContain("Tab cycle");
    expect(frame).toContain("⏵⏵");
    const lines = frame.split("\n");
    expect(lines[0]).toMatch(/^─+$/);
  });
});
