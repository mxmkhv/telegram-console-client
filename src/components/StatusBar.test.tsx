import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { StatusBar } from "./StatusBar";
import { SkinContext } from "./ui/SkinContext";

describe("StatusBar", () => {
  it("renders correctly when connected", () => {
    const { lastFrame } = render(
      <StatusBar connectionState="connected" focusedPanel="chatList" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders correctly when connecting", () => {
    const { lastFrame } = render(
      <StatusBar connectionState="connecting" focusedPanel="chatList" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders correctly when disconnected", () => {
    const { lastFrame } = render(
      <StatusBar connectionState="disconnected" focusedPanel="chatList" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders with different focused panels", () => {
    const { lastFrame } = render(
      <StatusBar connectionState="connected" focusedPanel="messages" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("drops the round border for a top rule under the claudeCode skin (default skin keeps it)", () => {
    const defaultFrame =
      render(<StatusBar connectionState="connected" focusedPanel="chatList" />).lastFrame() ?? "";
    const claudeCodeFrame =
      render(
        <SkinContext.Provider value="claudeCode">
          <StatusBar connectionState="connected" focusedPanel="chatList" />
        </SkinContext.Provider>,
      ).lastFrame() ?? "";

    expect(defaultFrame).toContain("╭");
    const claudeCodeLines = claudeCodeFrame.split("\n");
    expect(claudeCodeLines[0]).toMatch(/^─+$/);
    expect(claudeCodeFrame).not.toContain("╭");
  });
});
