import {
  transformSchemaViewLayout,
  type SchemaViewLayout,
} from "./schemaViewLayoutDefaults";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * SchemaViewLayout is persisted to IndexedDB via localforage. Older versions
 * stored the styling sidebar as two separate panels, so `activeSidebarItem`
 * could be "nodes-styling" or "edges-styling". Those were merged into a single
 * "styles" panel, but previously persisted layouts may still hold the old
 * values. transformSchemaViewLayout normalizes them on read so the sidebar isn't
 * stuck pointing at a panel that no longer exists.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("transformSchemaViewLayout backward compatibility", () => {
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
    };

    expect(transformSchemaViewLayout(layout)).toBe(layout);
  });

  it("leaves a null sidebar item untouched", () => {
    const layout: SchemaViewLayout = {
      activeSidebarItem: null,
      sidebar: { width: 400 },
    };

    expect(transformSchemaViewLayout(layout)).toBe(layout);
  });
});
