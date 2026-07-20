import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { BlankScreen } from "./BlankScreen";

describe("BlankScreen", () => {
  it("renders a blank screen with no visible content", () => {
    const frame = render(<BlankScreen />).lastFrame() ?? "";
    expect(frame.trim()).toBe("");
  });
});
