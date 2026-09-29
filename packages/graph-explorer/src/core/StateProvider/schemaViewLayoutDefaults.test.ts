import { logger } from "@/utils";

import {
  defaultSchemaViewLayout,
  transformSchemaViewLayout,
  type SchemaViewLayout,
} from "./schemaViewLayoutDefaults";

it("defaults the layout algorithm to F_COSE", () => {
  expect(defaultSchemaViewLayout.layoutAlgorithm).toBe("F_COSE");
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * SchemaViewLayout is persisted to IndexedDB via localforage. Older versions
 * stored the styling sidebar as two separate panels, so `activeSidebarItem`
 * could be "nodes-styling" or "edges-styling". Those versions also had no
 * `layoutAlgorithm`. transformSchemaViewLayout maps the old panels to "styles"
 * and supplies F_COSE when the algorithm is absent so legacy preferences remain
 * usable.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("transformSchemaViewLayout backward compatibility", () => {
  it("defaults a missing layout algorithm to F_COSE", () => {
    const legacy = {
      activeSidebarItem: "details",
      sidebar: { width: 400 },
      detailsAutoOpenOnSelection: false,
    } as unknown as SchemaViewLayout;

    expect(transformSchemaViewLayout(legacy)).toStrictEqual({
      activeSidebarItem: "details",
      sidebar: { width: 400 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "F_COSE",
    });
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("preserves a recognized layout algorithm", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: "details",
      sidebar: { width: 400 },
      layoutAlgorithm: "D3",
    };

    expect(transformSchemaViewLayout(layout)).toBe(layout);
  });

  it("recovers an unrecognized layout algorithm to F_COSE", () => {
    const invalid = {
      activeSidebarItem: "details",
      sidebar: { width: 400 },
      layoutAlgorithm: "REMOVED_LAYOUT",
    } as unknown as SchemaViewLayout;

    expect(transformSchemaViewLayout(invalid)).toStrictEqual({
      activeSidebarItem: "details",
      sidebar: { width: 400 },
      layoutAlgorithm: "F_COSE",
    });
    expect(logger.debug).toHaveBeenCalledWith(
      '[schema-view-layout] Unrecognized layout algorithm; using "F_COSE"',
      "REMOVED_LAYOUT",
    );
  });

  it("maps legacy nodes-styling to styles", () => {
    const legacy = {
      activeSidebarItem: "nodes-styling",
      sidebar: { width: 400 },
    } as unknown as SchemaViewLayout;

    expect(transformSchemaViewLayout(legacy).activeSidebarItem).toBe("styles");
  });

  it("maps legacy edges-styling to styles", () => {
    const legacy = {
      activeSidebarItem: "edges-styling",
      sidebar: { width: 400 },
    } as unknown as SchemaViewLayout;

    expect(transformSchemaViewLayout(legacy).activeSidebarItem).toBe("styles");
  });

  it("leaves a current sidebar item untouched", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: "details",
      sidebar: { width: 400 },
      layoutAlgorithm: "F_COSE",
    };

    expect(transformSchemaViewLayout(layout)).toBe(layout);
  });

  it("leaves a null sidebar item untouched", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: null,
      sidebar: { width: 400 },
      layoutAlgorithm: "F_COSE",
    };

    expect(transformSchemaViewLayout(layout)).toBe(layout);
  });
});
