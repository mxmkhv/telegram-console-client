import { test, expect } from "bun:test";
import { appReducer, initialState } from "./reducer";

test("initialState.uiMode is 'full'", () => {
  expect(initialState.uiMode).toBe("full");
});

test("SET_UI_MODE switches the mode", () => {
  const next = appReducer(initialState, { type: "SET_UI_MODE", payload: "minimal" });
  expect(next.uiMode).toBe("minimal");
});
