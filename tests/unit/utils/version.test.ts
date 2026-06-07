import { describe, it, expect } from "vitest";

describe("app version", () => {
  const pkg = { version: "0.3.3" };

  it("should have __APP_VERSION__ global defined", () => {
    expect(typeof __APP_VERSION__).toBe("string");
    expect(__APP_VERSION__.length).toBeGreaterThan(0);
  });

  it("should have version 0.3.3", () => {
    expect(pkg.version).toBe("0.3.3");
  });

  it("should have semver format", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
