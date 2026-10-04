import { describe, expect, it, test } from "vitest";
import { z } from "zod";

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
    };

    expect(schemaViewLayoutCodec.parseStored(layout)).toStrictEqual(layout);
  });
});

describe("schemaViewLayoutCodec", () => {
  test("round-trips a layout through serialize/deserialize", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: "styles",
      sidebar: { width: 321 },
      detailsAutoOpenOnSelection: false,
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
