import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { App } from "./app";

describe("App Integration", () => {
  it("renders without crashing in mock mode", () => {
    const { lastFrame } = render(<App useMock />);
    expect(lastFrame()).toBeDefined();
  });

  it("shows welcome message on initial render", () => {
    const { lastFrame } = render(<App useMock />);
    const frame = lastFrame();
    expect(frame).toContain("Welcome");
  });
});
