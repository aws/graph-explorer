import type dynamicIconImports from "lucide-react/dynamicIconImports";

import {
  allIconNamesSorted,
  getLucideName,
  getLucideSvgString,
  isLucideIconRef,
  isValidLucideIconName,
  LUCIDE_PREFIX,
  toLucideIconRef,
} from "./lucideIcons";

vi.mock("lucide-react/dynamicIconImports", async () => {
  const actual = await vi.importActual("lucide-react/dynamicIconImports");
  return {
    ...actual,
    default: {
      ...(actual as { default: typeof dynamicIconImports }).default,
      "throwing-icon": () => Promise.reject(new Error("import failed")),
    },
  };
});

describe("LUCIDE_PREFIX", () => {
  it("is 'lucide:'", () => {
    expect(LUCIDE_PREFIX).toBe("lucide:");
  });
});

describe("isLucideIconRef", () => {
  it("recognizes lucide refs", () => {
    expect(isLucideIconRef("lucide:plane")).toBe(true);
    expect(isLucideIconRef("lucide:log-in")).toBe(true);
  });

  it("rejects other values", () => {
    expect(isLucideIconRef(undefined)).toBe(false);
    expect(isLucideIconRef("")).toBe(false);
    expect(isLucideIconRef("data:image/svg+xml;base64,XXX")).toBe(false);
    expect(isLucideIconRef("https://example.com/icon.svg")).toBe(false);
  });

  it("narrows the type to a template literal", () => {
    const url: string | undefined = "lucide:plane";
    expect(isLucideIconRef(url)).toBe(true);
  });
});

describe("isValidLucideIconName", () => {
  it("accepts known icons", () => {
    expect(isValidLucideIconName("user")).toBe(true);
    expect(isValidLucideIconName("log-in")).toBe(true);
  });

  it("rejects unknown names", () => {
    expect(isValidLucideIconName("not-a-real-icon")).toBe(false);
    expect(isValidLucideIconName("")).toBe(false);
  });
});

describe("getLucideName", () => {
  it("extracts the name from a lucide ref", () => {
    expect(getLucideName("lucide:plane")).toBe("plane");
    expect(getLucideName("lucide:log-in")).toBe("log-in");
  });

  it("returns null for non-lucide values", () => {
    expect(getLucideName(undefined)).toBeNull();
    expect(getLucideName("")).toBeNull();
    expect(getLucideName("data:image/svg+xml;base64,XXX")).toBeNull();
    expect(getLucideName("https://example.com/icon.svg")).toBeNull();
  });
});

describe("toLucideIconRef", () => {
  it("builds a lucide ref", () => {
    expect(toLucideIconRef("plane")).toBe("lucide:plane");
    expect(toLucideIconRef("log-in")).toBe("lucide:log-in");
  });
});

describe("allIconNamesSorted", () => {
  it("is sorted alphabetically", () => {
    const copy = [...allIconNamesSorted];
    copy.sort();
    expect(allIconNamesSorted).toEqual(copy);
  });

  it("contains known icons", () => {
    expect(allIconNamesSorted).toContain("user");
    expect(allIconNamesSorted).toContain("mail");
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

  it("returns null when dynamic import throws", async () => {
    const svg = await getLucideSvgString("throwing-icon");
    expect(svg).toBeNull();
  });
});
