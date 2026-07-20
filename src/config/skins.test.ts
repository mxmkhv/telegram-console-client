import { describe, it, expect } from "bun:test";
import { SKINS, SKIN_NAMES, getSkin } from "./skins";
import type { SkinName } from "../types";

describe("getSkin", () => {
  it("resolves known skin names", () => {
    expect(getSkin("default")).toBe(SKINS.default);
    expect(getSkin("claudeCode")).toBe(SKINS.claudeCode);
  });

  it("falls back to default for an unknown name", () => {
    // @ts-expect-error testing the runtime fallback for a bad persisted value
    expect(getSkin("not-a-skin")).toBe(SKINS.default);
  });
});

describe("SKINS", () => {
  it("default skin has no color remapping", () => {
    expect(SKINS.default.colorMap).toEqual({});
  });

  it("claudeCode skin remaps the accent colors", () => {
    expect(SKINS.claudeCode.colorMap.cyan).toBeDefined();
    expect(SKINS.claudeCode.colorMap.blue).toBeDefined();
  });

  it("only the claudeCode skin enables the input ribbon", () => {
    expect(SKINS.default.inputRibbon).toBe(false);
    expect(SKINS.claudeCode.inputRibbon).toBe(true);
  });

  it("only the claudeCode skin enables borderless panel dividers", () => {
    expect(SKINS.default.panelDividers).toBe(false);
    expect(SKINS.claudeCode.panelDividers).toBe(true);
  });

  it("SKIN_NAMES matches the keys of SKINS", () => {
    expect([...SKIN_NAMES].sort()).toEqual(Object.keys(SKINS).sort() as SkinName[]);
  });
});
