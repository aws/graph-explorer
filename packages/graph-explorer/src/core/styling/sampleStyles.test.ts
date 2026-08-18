import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { createEdgeType, createVertexType } from "@/core/entities";
import { parseStylingFile } from "@/core/styling";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function asFile(contents: string, name: string): File {
  return new File([contents], name, { type: "application/json" });
}

describe("air_routes sample styles file", () => {
  test("parses and differentiates air routes vertex and edge types", async () => {
    const sampleStylesPath = join(
      __dirname,
      "../../../../../samples/air_routes/styles.json",
    );
    const sampleStyles = readFileSync(sampleStylesPath, "utf-8");

    const parsed = await parseStylingFile(asFile(sampleStyles, "styles.json"));

    const airport = parsed.vertexStyles.get(createVertexType("airport"));
    const country = parsed.vertexStyles.get(createVertexType("country"));
    const continent = parsed.vertexStyles.get(createVertexType("continent"));
    const route = parsed.edgeStyles.get(createEdgeType("route"));
    const contains = parsed.edgeStyles.get(createEdgeType("contains"));

    expect(airport).toBeDefined();
    expect(country).toBeDefined();
    expect(continent).toBeDefined();
    expect(route).toBeDefined();
    expect(contains).toBeDefined();

    expect(airport!.color).not.toBe(country!.color);
    expect(airport!.color).not.toBe(continent!.color);
    expect(country!.color).not.toBe(continent!.color);

    expect(
      new Set([airport!.shape, country!.shape, continent!.shape]).size,
    ).toBe(3);

    expect(airport!.iconUrl).toMatch(/^lucide:/);

    expect(route!.lineColor).not.toBe(contains!.lineColor);
    expect(route!.lineStyle).not.toBe(contains!.lineStyle);
  });
});
