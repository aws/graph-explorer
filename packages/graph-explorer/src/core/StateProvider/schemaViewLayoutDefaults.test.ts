import { describe, expect, test } from "vitest";

import {
  defaultSchemaViewLayout,
  schemaViewLayoutCodec,
  type SchemaViewLayout,
} from "./schemaViewLayoutDefaults";

describe("schemaViewLayoutCodec", () => {
  test("round-trips a layout through serialize/deserialize", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: "nodes-styling",
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

  test("treats a missing or corrupt value as a miss", () => {
    expect(schemaViewLayoutCodec.deserialize(null)).toBeNull();
    expect(schemaViewLayoutCodec.deserialize("{ not json")).toBeNull();
    expect(schemaViewLayoutCodec.deserialize("{}")).toBeNull();
  });
});
