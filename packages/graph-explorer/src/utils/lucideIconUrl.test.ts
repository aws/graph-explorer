import type dynamicIconImports from "lucide-react/dynamicIconImports";

import { lucideIconToDataUri } from "./lucideIconUrl";

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
