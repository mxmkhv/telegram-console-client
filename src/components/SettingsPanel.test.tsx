import { describe, it, expect, mock } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";

// SettingsPanel's handleSelect calls loadConfig()/saveConfig() with no
// customDir, i.e. the real ~/.config/telegram-console/config.json. Stub the
// module so interacting with the settings panel in tests never touches the
// developer's actual persisted config.
mock.module("../config", () => ({
  loadConfig: () => null,
  saveConfig: () => {},
}));

import { SettingsPanel } from "./SettingsPanel";
import { AppProvider } from "../state/context";
import type { SkinName } from "../types";

function renderPanel(initialSkin?: SkinName) {
  return render(
    <AppProvider initialSkin={initialSkin}>
      <SettingsPanel />
    </AppProvider>,
  );
}

const ESC = String.fromCharCode(27);
const DOWN = ESC + "[B";
const RIGHT = ESC + "[C";
const ENTER = String.fromCharCode(13);
const wait = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("SettingsPanel tabs", () => {
  it("shows both tab labels and defaults to the Message Layout tab", () => {
    const frame = renderPanel("default").lastFrame() ?? "";
    expect(frame).toContain("Message Layout");
    expect(frame).toContain("Skin");
    expect(frame).toContain("Classic");
    expect(frame).toContain("Bubble");
    expect(frame).not.toContain("Claude Code");
  });

  it("switches to the Skin tab with the right arrow", async () => {
    const { stdin, lastFrame } = renderPanel("default");
    stdin.write(RIGHT);
    await wait();

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Default");
    expect(frame).toContain("Claude Code");
    expect(frame).not.toContain("Classic");
  });

  it("marks the active skin as current on the Skin tab", async () => {
    const { stdin, lastFrame } = renderPanel("claudeCode");
    stdin.write(RIGHT);
    await wait();

    const frame = lastFrame() ?? "";
    const claudeCodeLine = frame
      .split("\n")
      .find((line) => line.includes("Claude Code"));
    expect(claudeCodeLine).toContain("(current)");
  });

  it("selects the Claude Code skin and updates the current marker", async () => {
    const { stdin, lastFrame } = renderPanel("default");
    stdin.write(RIGHT);
    await wait();
    stdin.write(DOWN);
    await wait();
    stdin.write(ENTER);
    await wait();

    const frame = lastFrame() ?? "";
    const claudeCodeLine = frame
      .split("\n")
      .find((line) => line.includes("Claude Code"));
    expect(claudeCodeLine).toContain("(current)");
  });
});
