import {
  DefaultStylingSchema,
  fetchDefaultStyling,
  parseDefaultStyling,
  resolveDefaultStyling,
  userStylingToExportFormat,
} from "./defaultStyling";
import { createEdgeType, createVertexType } from "./entities";

describe("DefaultStylingSchema", () => {
  it("should accept a valid complete config", () => {
    const data = {
      vertices: {
        User: {
          color: "#1565C0",
          icon: "user",
          shape: "ellipse",
          backgroundOpacity: 0.4,
          borderWidth: 2,
          borderColor: "#000000",
          borderStyle: "solid",
        },
      },
      edges: {
        OWNS: {
          lineColor: "#2E7D32",
          lineThickness: 3,
          lineStyle: "dashed",
          sourceArrowStyle: "none",
          targetArrowStyle: "triangle",
        },
      },
    };

    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should accept an empty object", () => {
    const result = DefaultStylingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept partial vertex entries", () => {
    const data = {
      vertices: {
        User: { color: "#1565C0" },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should accept partial edge entries", () => {
    const data = {
      edges: {
        OWNS: { lineColor: "#2E7D32" },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should accept vertex entries with zero values", () => {
    const data = {
      vertices: {
        User: { backgroundOpacity: 0, borderWidth: 0 },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vertices?.User.backgroundOpacity).toBe(0);
      expect(result.data.vertices?.User.borderWidth).toBe(0);
    }
  });

  it("should reject unknown top-level properties", () => {
    const data = { unknownProp: "value" };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject unknown vertex properties", () => {
    const data = {
      vertices: {
        User: { unknownProp: "value" },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject invalid backgroundOpacity", () => {
    const data = {
      vertices: {
        User: { backgroundOpacity: 2 },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject invalid borderStyle", () => {
    const data = {
      vertices: {
        User: { borderStyle: "wavy" },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject invalid shape", () => {
    const data = {
      vertices: {
        User: { shape: "banana" },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept valid shape values", () => {
    const shapes = [
      "ellipse",
      "rectangle",
      "round-rectangle",
      "diamond",
      "star",
    ];
    for (const shape of shapes) {
      const data = { vertices: { User: { shape } } };
      const result = DefaultStylingSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid arrow style", () => {
    const data = {
      edges: {
        OWNS: { targetArrowStyle: "star" },
      },
    };
    const result = DefaultStylingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("fetchDefaultStyling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return parsed data on successful fetch", async () => {
    const mockData = { vertices: { User: { color: "#1565C0" } } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );
    const result = await fetchDefaultStyling();
    expect(result).not.toBeNull();
    expect(result?.vertices?.User.color).toBe("#1565C0");
  });

  it("should return null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );
    const result = await fetchDefaultStyling();
    expect(result).toBeNull();
  });

  it("should return null on non-404 error status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Server Error", { status: 500 }),
    );
    const result = await fetchDefaultStyling();
    expect(result).toBeNull();
  });

  it("should return null on fetch exception", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const result = await fetchDefaultStyling();
    expect(result).toBeNull();
  });

  it("should return null for invalid JSON response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"vertices": "invalid"}', { status: 200 }),
    );
    const result = await fetchDefaultStyling();
    expect(result).toBeNull();
  });
});

describe("parseDefaultStyling", () => {
  it("should return parsed data for valid input", () => {
    const data = {
      vertices: {
        User: { color: "#1565C0", icon: "user" },
      },
    };
    const result = parseDefaultStyling(data);
    expect(result).not.toBeNull();
    expect(result?.vertices?.User.color).toBe("#1565C0");
  });

  it("should return null for invalid input", () => {
    const result = parseDefaultStyling({ vertices: "invalid" });
    expect(result).toBeNull();
  });

  it("should return null for non-object input", () => {
    const result = parseDefaultStyling("not an object");
    expect(result).toBeNull();
  });

  it("should return null for null input", () => {
    const result = parseDefaultStyling(null);
    expect(result).toBeNull();
  });
});

describe("resolveDefaultStyling", () => {
  it("should resolve lucide icon names to data URIs", async () => {
    const data = {
      vertices: {
        User: { icon: "user", color: "#1565C0" },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.vertices).toHaveLength(1);
    expect(result.vertices?.[0].type).toBe(createVertexType("User"));
    expect(result.vertices?.[0].iconUrl).toMatch(
      /^data:image\/svg\+xml;base64,/,
    );
    expect(result.vertices?.[0].iconImageType).toBe("image/svg+xml");
    expect(result.vertices?.[0].color).toBe("#1565C0");
  });

  it("should prefer explicit iconUrl over lucide icon name", async () => {
    const data = {
      vertices: {
        User: {
          icon: "user",
          iconUrl: "https://example.com/icon.svg",
          iconImageType: "image/svg+xml",
        },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.vertices?.[0].iconUrl).toBe("https://example.com/icon.svg");
  });

  it("should handle unknown lucide icon names gracefully", async () => {
    const data = {
      vertices: {
        User: { icon: "not-a-real-icon", color: "#1565C0" },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.vertices?.[0].iconUrl).toBeUndefined();
    expect(result.vertices?.[0].color).toBe("#1565C0");
  });

  it("should resolve edge styles", async () => {
    const data = {
      edges: {
        OWNS: { lineColor: "#2E7D32", lineThickness: 3 },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.edges).toHaveLength(1);
    expect(result.edges?.[0].type).toBe(createEdgeType("OWNS"));
    expect(result.edges?.[0].lineColor).toBe("#2E7D32");
    expect(result.edges?.[0].lineThickness).toBe(3);
  });

  it("should handle empty data", async () => {
    const result = await resolveDefaultStyling({});
    expect(result.vertices).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("should handle multiple vertex types", async () => {
    const data = {
      vertices: {
        User: { color: "#1565C0" },
        Account: { color: "#2E7D32" },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.vertices).toHaveLength(2);
    const types = result.vertices?.map(v => v.type);
    expect(types).toContain(createVertexType("User"));
    expect(types).toContain(createVertexType("Account"));
  });

  it("should resolve all vertex style properties", async () => {
    const data = {
      vertices: {
        User: {
          color: "#1565C0",
          displayLabel: "Person",
          displayNameAttribute: "name",
          longDisplayNameAttribute: "fullName",
          shape: "round-rectangle" as const,
          backgroundOpacity: 0.5,
          borderWidth: 2,
          borderColor: "#000000",
          borderStyle: "dashed" as const,
        },
      },
    };
    const result = await resolveDefaultStyling(data);
    const v = result.vertices?.[0];

    expect(v?.color).toBe("#1565C0");
    expect(v?.displayLabel).toBe("Person");
    expect(v?.displayNameAttribute).toBe("name");
    expect(v?.longDisplayNameAttribute).toBe("fullName");
    expect(v?.shape).toBe("round-rectangle");
    expect(v?.backgroundOpacity).toBe(0.5);
    expect(v?.borderWidth).toBe(2);
    expect(v?.borderColor).toBe("#000000");
    expect(v?.borderStyle).toBe("dashed");
  });

  it("should resolve iconUrl and iconImageType when explicitly provided", async () => {
    const data = {
      vertices: {
        User: {
          iconUrl: "https://example.com/icon.png",
          iconImageType: "image/png",
        },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.vertices?.[0].iconUrl).toBe("https://example.com/icon.png");
    expect(result.vertices?.[0].iconImageType).toBe("image/png");
  });

  it("should preserve zero values for backgroundOpacity and borderWidth", async () => {
    const data = {
      vertices: {
        User: { backgroundOpacity: 0, borderWidth: 0 },
      },
    };
    const result = await resolveDefaultStyling(data);

    expect(result.vertices?.[0].backgroundOpacity).toBe(0);
    expect(result.vertices?.[0].borderWidth).toBe(0);
  });
});

describe("userStylingToExportFormat", () => {
  it("should convert vertex styling to export format", () => {
    const styling = {
      vertices: [
        {
          type: createVertexType("User"),
          color: "#1565C0",
          iconUrl: "data:image/svg+xml;base64,abc",
        },
      ],
    };
    const result = userStylingToExportFormat(styling);

    expect(result.vertices).toBeDefined();
    expect(result.vertices?.User).toEqual({
      color: "#1565C0",
      iconUrl: "data:image/svg+xml;base64,abc",
    });
  });

  it("should convert edge styling to export format", () => {
    const styling = {
      edges: [
        {
          type: createEdgeType("OWNS"),
          lineColor: "#2E7D32",
          lineThickness: 3,
        },
      ],
    };
    const result = userStylingToExportFormat(styling);

    expect(result.edges).toBeDefined();
    expect(result.edges?.OWNS).toEqual({
      lineColor: "#2E7D32",
      lineThickness: 3,
    });
  });

  it("should return empty object for empty styling", () => {
    const result = userStylingToExportFormat({});
    expect(result).toEqual({});
  });

  it("should not include type in the exported entry", () => {
    const styling = {
      vertices: [
        {
          type: createVertexType("User"),
          color: "#1565C0",
        },
      ],
    };
    const result = userStylingToExportFormat(styling);

    expect(result.vertices?.User).not.toHaveProperty("type");
  });
});
