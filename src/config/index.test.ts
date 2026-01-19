import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig, saveConfig, getConfigPath, hasConfig } from "./index";
import { rmSync, mkdirSync } from "fs";
import { join } from "path";

const TEST_CONFIG_DIR = join(import.meta.dir, "../../.test-config");

describe("Config", () => {
  beforeEach(() => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  });

  it("returns false when no config exists", () => {
    expect(hasConfig(TEST_CONFIG_DIR)).toBe(false);
  });

  it("saves and loads config", () => {
    const config = {
      apiId: 12345,
      apiHash: "abc123",
      sessionPersistence: "persistent" as const,
      logLevel: "info" as const,
      authMethod: "qr" as const,
    };

    saveConfig(config, TEST_CONFIG_DIR);
    expect(hasConfig(TEST_CONFIG_DIR)).toBe(true);

    const loaded = loadConfig(TEST_CONFIG_DIR);
    expect(loaded).toEqual(config);
  });

  it("returns correct config path", () => {
    const path = getConfigPath(TEST_CONFIG_DIR);
    expect(path).toContain("config.json");
  });
});
