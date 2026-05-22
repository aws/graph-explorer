import type dynamicIconImports from "lucide-react/dynamicIconImports";

import {
  getLucideName,
  getLucideSvgString,
  isLucideIconRef,
  LUCIDE_PREFIX,
  lucideIconToDataUri,
  resolveIconUrl,
  toLucideIconRef,
} from "./lucideIconUrl";

vi.mock("lucide-react/dynamicIconImports", async () => {
  const actual = await vi.importActual("lucide-react/dynamicIconImports");
  return {
    ...actual,
    default: {
      ...(actual as { default: typeof dynamicIconImports }).default,
      // Icon that loads but has no __iconNode
      "missing-icon-node": () => Promise.resolve({ default: {} }),
      // Icon that throws on import
      "throwing-icon": () => Promise.reject(new Error("import failed")),
    },
  };
});

describe("lucideIconToDataUri", () => {
  it("should return a data URI for a valid icon name", async () => {
    const result = await lucideIconToDataUri("user");
    expect(result).not.toBeNull();
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("should return a valid SVG when decoded", async () => {
    const result = await lucideIconToDataUri("user");
    expect(result).not.toBeNull();

    const base64 = result!.replace("data:image/svg+xml;base64,", "");
    const svg = atob(base64);
    expect(svg).toContain("<svg");
    expect(svg).toContain("xmlns=");
    expect(svg).toContain("viewBox");
    expect(svg).toContain("</svg>");
  });

  it("should return null for an unknown icon name", async () => {
    const result = await lucideIconToDataUri("not-a-real-icon-name");
    expect(result).toBeNull();
  });

  it("should return null for an empty string", async () => {
    const result = await lucideIconToDataUri("");
    expect(result).toBeNull();
  });

  it("should handle kebab-case icon names", async () => {
    const result = await lucideIconToDataUri("log-in");
    expect(result).not.toBeNull();
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("should produce different SVGs for different icons", async () => {
    const user = await lucideIconToDataUri("user");
    const mail = await lucideIconToDataUri("mail");
    expect(user).not.toBeNull();
    expect(mail).not.toBeNull();
    expect(user).not.toEqual(mail);
  });

  it("should return null when module has no __iconNode", async () => {
    const result = await lucideIconToDataUri("missing-icon-node");
    expect(result).toBeNull();
  });

  it("should return null when dynamic import throws", async () => {
    const result = await lucideIconToDataUri("throwing-icon");
    expect(result).toBeNull();
  });

  it("should not include React key attributes in the SVG output", async () => {
    const result = await lucideIconToDataUri("user");
    expect(result).not.toBeNull();

    const base64 = result!.replace("data:image/svg+xml;base64,", "");
    const svg = atob(base64);
    expect(svg).not.toContain("key=");
  });
});

describe("lucide reference helpers", () => {
  it("LUCIDE_PREFIX is 'lucide:'", () => {
    expect(LUCIDE_PREFIX).toBe("lucide:");
  });

  it("isLucideIconRef recognizes lucide refs", () => {
    expect(isLucideIconRef("lucide:plane")).toBe(true);
    expect(isLucideIconRef("lucide:log-in")).toBe(true);
  });

  it("isLucideIconRef rejects other values", () => {
    expect(isLucideIconRef(undefined)).toBe(false);
    expect(isLucideIconRef("")).toBe(false);
    expect(isLucideIconRef("data:image/svg+xml;base64,XXX")).toBe(false);
    expect(isLucideIconRef("https://example.com/icon.svg")).toBe(false);
  });

  it("getLucideName extracts the name from a lucide ref", () => {
    expect(getLucideName("lucide:plane")).toBe("plane");
    expect(getLucideName("lucide:log-in")).toBe("log-in");
  });

  it("getLucideName returns null for non-lucide values", () => {
    expect(getLucideName(undefined)).toBeNull();
    expect(getLucideName("")).toBeNull();
    expect(getLucideName("data:image/svg+xml;base64,XXX")).toBeNull();
    expect(getLucideName("https://example.com/icon.svg")).toBeNull();
  });

  it("toLucideIconRef builds a lucide ref", () => {
    expect(toLucideIconRef("plane")).toBe("lucide:plane");
    expect(toLucideIconRef("log-in")).toBe("lucide:log-in");
  });
});

describe("getLucideSvgString", () => {
  it("returns raw SVG markup for a valid icon", async () => {
    const svg = await getLucideSvgString("user");
    expect(svg).not.toBeNull();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("currentColor");
  });

  it("returns null for an unknown icon", async () => {
    const svg = await getLucideSvgString("not-a-real-icon-name");
    expect(svg).toBeNull();
  });
});

describe("resolveIconUrl", () => {
  it("resolves lucide:<name> to a data URI", async () => {
    const result = await resolveIconUrl("lucide:user");
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("returns null for unknown lucide name", async () => {
    const result = await resolveIconUrl("lucide:not-a-real-icon-name");
    expect(result).toBeNull();
  });

  it("passes through data: URIs unchanged", async () => {
    const dataUri = "data:image/svg+xml;base64,PHN2Zy8+";
    const result = await resolveIconUrl(dataUri);
    expect(result).toBe(dataUri);
  });

  it("passes through plain URLs unchanged", async () => {
    const url = "https://example.com/icon.svg";
    const result = await resolveIconUrl(url);
    expect(result).toBe(url);
  });

  it("returns null for undefined", async () => {
    const result = await resolveIconUrl(undefined);
    expect(result).toBeNull();
  });

  it("returns null for empty string", async () => {
    const result = await resolveIconUrl("");
    expect(result).toBeNull();
  });
});
