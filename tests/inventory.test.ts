import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import componentInventory from "./component-inventory.json";
import endpointInventory from "./endpoint-inventory.json";
import moduleInventory from "./module-inventory.json";

const PROJECT_ROOT = join(__dirname, "..");

describe("Inventory Drift Detection", () => {
  describe("Component Inventory", () => {
    it("should match UI components on disk", () => {
      const uiDir = join(PROJECT_ROOT, "src/components/ui");
      if (!existsSync(uiDir)) {
        expect.fail("UI components directory does not exist");
      }

      const files = readdirSync(uiDir)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => f.replace(".tsx", ""))
        .sort();

      const inventory = [...componentInventory.components.ui].sort();
      expect(files).toEqual(inventory);
    });

    it("should match feature components on disk", () => {
      const componentDir = join(PROJECT_ROOT, "src/components");
      if (!existsSync(componentDir)) {
        expect.fail("Components directory does not exist");
      }

      const files = readdirSync(componentDir)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => f.replace(".tsx", ""))
        .sort();

      const inventory = [...componentInventory.components.feature].sort();
      expect(files).toEqual(inventory);
    });
  });

  describe("Module Inventory", () => {
    it("should match api modules on disk", () => {
      const dir = join(PROJECT_ROOT, "src/api");
      if (!existsSync(dir)) {
        expect.fail("API directory does not exist");
      }

      const files = readdirSync(dir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        .sort();

      const inventory = [...moduleInventory.modules.api].sort();
      expect(files).toEqual(inventory);
    });

    it("should match lib modules on disk", () => {
      const dir = join(PROJECT_ROOT, "src/lib");
      if (!existsSync(dir)) {
        expect.fail("Lib directory does not exist");
      }

      const files = readdirSync(dir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        .sort();

      const inventory = [...moduleInventory.modules.lib].sort();
      expect(files).toEqual(inventory);
    });

    it("should match lib/background modules on disk", () => {
      const dir = join(PROJECT_ROOT, "src/lib/background");
      if (!existsSync(dir)) {
        expect.fail("Lib/background directory does not exist");
      }

      const files = readdirSync(dir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        .sort();

      const inventory = [...moduleInventory.modules["lib/background"]].sort();
      expect(files).toEqual(inventory);
    });

    it("should match workers modules on disk", () => {
      const dir = join(PROJECT_ROOT, "src/workers");
      if (!existsSync(dir)) {
        expect.fail("Workers directory does not exist");
      }

      const files = readdirSync(dir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        .sort();

      const inventory = [...moduleInventory.modules.workers].sort();
      expect(files).toEqual(inventory);
    });

    it("should match email modules on disk", () => {
      const dir = join(PROJECT_ROOT, "src/emails");
      if (!existsSync(dir)) {
        expect.fail("Emails directory does not exist");
      }

      const files = readdirSync(dir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        .sort();

      const inventory = [...moduleInventory.modules.emails].sort();
      expect(files).toEqual(inventory);
    });
  });

  describe("Endpoint Inventory", () => {
    it("should have all documented endpoints", () => {
      expect(endpointInventory.endpoints.length).toBeGreaterThan(0);
      expect(endpointInventory.endpoints.every((e) => e.method && e.path && e.description)).toBe(
        true,
      );
    });

    it("should have valid HTTP methods", () => {
      const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
      for (const endpoint of endpointInventory.endpoints) {
        expect(validMethods).toContain(endpoint.method);
      }
    });
  });
});
