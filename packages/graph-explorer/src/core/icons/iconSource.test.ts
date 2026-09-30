import { describe, expect, it } from "vitest";

import { classifyIconSource, iconSourceId } from "./iconSource";

describe("classifyIconSource", () => {
  it("classifies a missing icon url as none", () => {
    expect(
      classifyIconSource({ iconUrl: "", iconImageType: "image/svg+xml" }),
    ).toStrictEqual({ kind: "none" });
  });

  // `encodeURIComponent` throws on a lone surrogate during style computation,
  // which would take down the whole app.
  it("classifies a url that is not well-formed UTF-16 as none", () => {
    expect(
      classifyIconSource({
        iconUrl: "data:image/png;base64,AAA\uD800BBB",
        iconImageType: "image/png",
      }),
    ).toStrictEqual({ kind: "none" });
  });

  it("classifies a lucide reference by prefix", () => {
    expect(
      classifyIconSource({
        iconUrl: "lucide:plane",
        iconImageType: "image/svg+xml",
      }),
    ).toStrictEqual({ kind: "lucide", name: "plane" });
  });

  it("classifies a lucide reference even when the image type is not svg", () => {
    expect(
      classifyIconSource({
        iconUrl: "lucide:plane",
        iconImageType: "image/png",
      }),
    ).toStrictEqual({ kind: "lucide", name: "plane" });
  });

  it("classifies an svg url by image type", () => {
    expect(
      classifyIconSource({
        iconUrl: "https://example.test/a.svg",
        iconImageType: "image/svg+xml",
      }),
    ).toStrictEqual({ kind: "svg", url: "https://example.test/a.svg" });
  });

  it("classifies anything else as raster", () => {
    expect(
      classifyIconSource({
        iconUrl: "https://example.test/a.png",
        iconImageType: "image/png",
      }),
    ).toStrictEqual({ kind: "raster", url: "https://example.test/a.png" });
  });
});

describe("iconSourceId", () => {
  it("has no id for an absent icon", () => {
    expect(iconSourceId({ kind: "none" })).toBeNull();
  });

  it("namespaces the id by kind so a url and a lucide name cannot collide", () => {
    expect(iconSourceId({ kind: "lucide", name: "plane" })).toBe(
      "lucide:plane",
    );
    expect(iconSourceId({ kind: "svg", url: "plane" })).toBe("svg:plane");
    expect(iconSourceId({ kind: "raster", url: "plane" })).toBe("raster:plane");
  });

  it("gives the same id to two sources describing the same icon", () => {
    const a = classifyIconSource({
      iconUrl: "https://example.test/a.svg",
      iconImageType: "image/svg+xml",
    });
    const b = classifyIconSource({
      iconUrl: "https://example.test/a.svg",
      iconImageType: "image/svg+xml",
    });

    expect(iconSourceId(a)).toBe(iconSourceId(b));
  });
});
