import { describe, expect, it, test } from "vitest";
import { z } from "zod";

import { logger } from "@/utils";

import {
  defaultSchemaViewLayout,
  schemaViewLayoutCodec,
  type SchemaViewLayout,
} from "./schemaViewLayoutDefaults";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * SchemaViewLayout is persisted to IndexedDB via localforage. Older versions
 * stored the styling sidebar as two separate panels, so `activeSidebarItem`
 * could be "nodes-styling" or "edges-styling". Those were merged into a single
 * "styles" panel, but previously persisted layouts may still hold the old
 * values. `parseStored` normalizes them when it reads the shared breadcrumb, so
 * an upgrading user keeps their layout instead of having it discarded as corrupt.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("backward compatibility: schemaViewLayoutCodec.parseStored", () => {
  it.each(["nodes-styling", "edges-styling"])(
    "maps legacy %s to styles",
    activeSidebarItem => {
      const legacy = { activeSidebarItem, sidebar: { width: 400 } };

      expect(schemaViewLayoutCodec.parseStored(legacy).activeSidebarItem).toBe(
        "styles",
      );
    },
  );

  it("keeps a current layout unchanged", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: null,
      sidebar: { width: 512 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "DAGRE_LR",
    };

    expect(schemaViewLayoutCodec.parseStored(layout)).toStrictEqual(layout);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Older versions did not store `layoutAlgorithm` at all, and a later version may
 * remove a layout a stored value still names. Either way the layout algorithm
 * falls back to F_COSE on its own, so the rest of the stored layout (sidebar
 * panel, width, auto-open) survives instead of the whole value being discarded
 * as corrupt. Only an unknown value is worth a warning; a missing one is just
 * pre-feature data.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("backward compatibility: schemaViewLayout layoutAlgorithm", () => {
  const storedWithout = {
    activeSidebarItem: "styles",
    sidebar: { width: 420 },
    detailsAutoOpenOnSelection: false,
  };
  const storedWith = (layoutAlgorithm: unknown) => ({
    ...storedWithout,
    layoutAlgorithm,
  });
  const parsers = [
    {
      name: "parseStored",
      parse: (stored: unknown) => schemaViewLayoutCodec.parseStored(stored),
    },
    {
      name: "deserialize",
      parse: (stored: unknown) =>
        schemaViewLayoutCodec.deserialize(JSON.stringify(stored)),
    },
  ];

  describe.each(parsers)("$name", ({ parse }) => {
    it("fills a missing layout algorithm with F_COSE without warning", () => {
      expect(parse(storedWithout)).toStrictEqual(storedWith("F_COSE"));
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("replaces an unknown layout algorithm with F_COSE and warns, keeping the other fields", () => {
      expect(parse(storedWith("REMOVED_LAYOUT"))).toStrictEqual(
        storedWith("F_COSE"),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        '[graph-layout] Unrecognized layout name; using "F_COSE"',
        "REMOVED_LAYOUT",
      );
    });

    it("keeps a known layout algorithm", () => {
      expect(parse(storedWith("SUBWAY_RL"))).toStrictEqual(
        storedWith("SUBWAY_RL"),
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});

describe("schemaViewLayoutCodec", () => {
  test("round-trips a layout through serialize/deserialize", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: "styles",
      sidebar: { width: 321 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "KLAY_TB",
    };

    expect(
      schemaViewLayoutCodec.deserialize(
        schemaViewLayoutCodec.serialize(layout),
      ),
    ).toStrictEqual(layout);
  });

  test("round-trips the default layout", () => {
    expect(
      schemaViewLayoutCodec.deserialize(
        schemaViewLayoutCodec.serialize(defaultSchemaViewLayout),
      ),
    ).toStrictEqual(defaultSchemaViewLayout);
  });

  test("treats an absent value as a miss", () => {
    expect(schemaViewLayoutCodec.deserialize(null)).toBeNull();
    expect(schemaViewLayoutCodec.deserialize("")).toBeNull();
  });

  test("throws on a corrupt value so the seam can discard it", () => {
    // Asserted by type, not by message: these errors come from JSON.parse and
    // zod, whose messages shift between engine and library versions.
    expect(() => schemaViewLayoutCodec.deserialize("{ not json")).toThrow(
      SyntaxError,
    );
    expect(() => schemaViewLayoutCodec.deserialize("{}")).toThrow(z.ZodError);
  });

  test("throws on a corrupt stored value so the seam can discard it", () => {
    expect(() =>
      schemaViewLayoutCodec.parseStored({ activeSidebarItem: "details" }),
    ).toThrow(z.ZodError);
  });
});
