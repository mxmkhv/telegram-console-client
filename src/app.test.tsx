import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { App } from "./app";
import { AppProvider } from "./state/context";
import { createMockTelegramService } from "./services/telegram.mock";
import { MainApp } from "./app";

describe("App Integration", () => {
  it("renders without crashing in mock mode", () => {
    const { lastFrame } = render(<App useMock />);
    expect(lastFrame()).toBeDefined();
  });

  it("shows setup screen when no config exists", () => {
    const { lastFrame } = render(<App useMock />);
    const frame = lastFrame();
    // Without config, Setup is shown first (which contains "Welcome to telegram-console!")
    expect(frame).toContain("Welcome to telegram-console");
  });
});

describe("MainApp hidden mode", () => {
  let svc: ReturnType<typeof createMockTelegramService>;
  beforeEach(() => { svc = createMockTelegramService(); });
  afterEach(async () => { await svc.disconnect(); });

  it("pressing h blanks the screen and any key restores", async () => {
    const { lastFrame, stdin } = render(
      <AppProvider telegramService={svc} initialUiMode="full">
        <MainApp telegramService={svc} onLogout={() => {}} onToggleNoColor={() => {}} />
      </AppProvider>
    );
    await new Promise((r) => setTimeout(r, 200));
    expect(lastFrame() ?? "").toContain("Chats");

    stdin.write("h");
    await new Promise((r) => setTimeout(r, 50));
    const hidden = lastFrame() ?? "";
    expect(hidden).not.toContain("Chats");
    expect(hidden.trim()).toBe("");

    stdin.write(" ");
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame() ?? "").toContain("Chats");
  });
});

describe("MainApp minimal UI mode", () => {
  let mockService: ReturnType<typeof createMockTelegramService>;

  beforeEach(() => {
    mockService = createMockTelegramService();
  });

  afterEach(async () => {
    await mockService.disconnect();
  });

  it("full mode renders header and status chrome", async () => {
    const { lastFrame } = render(
      <AppProvider telegramService={mockService} initialUiMode="full">
        <MainApp telegramService={mockService} onLogout={() => {}} onToggleNoColor={() => {}} />
      </AppProvider>
    );
    // Wait for async connect + chats to load
    await new Promise((r) => setTimeout(r, 200));
    const frame = lastFrame() ?? "";
    expect(frame).toContain("telegram-console");
    expect(frame).toMatch(/Connected|Tab: Next|Esc: Back/);
  });

  it("pressing m switches to minimal mode and hides chrome", async () => {
    const { lastFrame, stdin } = render(
      <AppProvider telegramService={mockService} initialUiMode="full">
        <MainApp telegramService={mockService} onLogout={() => {}} onToggleNoColor={() => {}} />
      </AppProvider>
    );
    // Wait for chats to load (connect resolves after ~100ms in mock)
    await new Promise((r) => setTimeout(r, 200));
    // Send 'm' to toggle minimal mode (focused panel is chatList, not input)
    stdin.write("m");
    await new Promise((r) => setTimeout(r, 50));
    const frame = lastFrame() ?? "";
    expect(frame).not.toContain("telegram-console");
    expect(frame).not.toContain("[Logout]");
  });
});

describe("MainApp shortcuts legend + color toggle", () => {
  let svc: ReturnType<typeof createMockTelegramService>;
  beforeEach(() => { svc = createMockTelegramService(); });
  afterEach(async () => { await svc.disconnect(); });

  it("shows the shortcuts legend", async () => {
    const { lastFrame } = render(
      <AppProvider telegramService={svc} initialUiMode="full">
        <MainApp telegramService={svc} onLogout={() => {}} onToggleNoColor={() => {}} />
      </AppProvider>
    );
    await new Promise((r) => setTimeout(r, 200));
    expect(lastFrame() ?? "").toContain("c colors");
  });

  it("pressing c calls onToggleNoColor", async () => {
    let toggles = 0;
    const { stdin } = render(
      <AppProvider telegramService={svc} initialUiMode="full">
        <MainApp telegramService={svc} onLogout={() => {}} onToggleNoColor={() => { toggles++; }} />
      </AppProvider>
    );
    await new Promise((r) => setTimeout(r, 200));
    stdin.write("c");
    await new Promise((r) => setTimeout(r, 50));
    expect(toggles).toBe(1);
  });
});
