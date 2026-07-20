import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { HeaderBar } from "./HeaderBar";
import { SkinContext } from "./ui/SkinContext";

describe("HeaderBar", () => {
  it("renders correctly when focused", () => {
    const { lastFrame } = render(
      <HeaderBar isFocused={true} selectedButton="settings" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders correctly when unfocused", () => {
    const { lastFrame } = render(
      <HeaderBar isFocused={false} selectedButton="settings" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders with logout button selected", () => {
    const { lastFrame } = render(
      <HeaderBar isFocused={true} selectedButton="logout" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("drops the round border for a bottom rule under the claudeCode skin (default skin keeps it)", () => {
    const defaultFrame =
      render(<HeaderBar isFocused={true} selectedButton="settings" />).lastFrame() ?? "";
    const claudeCodeFrame =
      render(
        <SkinContext.Provider value="claudeCode">
          <HeaderBar isFocused={true} selectedButton="settings" />
        </SkinContext.Provider>,
      ).lastFrame() ?? "";

    expect(defaultFrame).toContain("╭");
    const claudeCodeLines = claudeCodeFrame.split("\n");
    expect(claudeCodeLines[0]).not.toContain("─");
    expect(claudeCodeFrame).not.toContain("╭");
    expect(claudeCodeFrame).toMatch(/─+\s*$/m);
  });
});
