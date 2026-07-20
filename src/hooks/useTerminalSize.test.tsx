import { test, expect } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { useTerminalSize } from "./useTerminalSize";

function Probe() {
  const { columns, rows } = useTerminalSize();
  return <Text>{`${columns}x${rows}`}</Text>;
}

test("returns the initial stdout dimensions", () => {
  const { lastFrame } = render(<Probe />);
  // ink-testing-library's mock stdout defaults to 100 columns; rows may be undefined → fallback 24
  expect(lastFrame()).toMatch(/^\d+x\d+$/);
});
