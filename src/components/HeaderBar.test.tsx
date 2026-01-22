import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { HeaderBar } from "./HeaderBar";

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
});
