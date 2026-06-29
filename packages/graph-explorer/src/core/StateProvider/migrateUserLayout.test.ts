import localForage from "localforage";

import { migrateUserLayoutIfNeeded } from "./migrateUserLayout";

describe("migrateUserLayoutIfNeeded", () => {
  beforeEach(async () => {
    await localForage.removeItem("user-layout");
    await localForage.removeItem("graph-view-layout");
  });

  it("should copy user-layout to graph-view-layout", async () => {
    // localforage persists the layout value as-is via structured clone, so
    // `activeToggles` is stored as a `Set` (not an array) — mirror that here.
    const oldData = {
      activeSidebarItem: "search",
      activeToggles: new Set(["graph-viewer", "table-view"]),
      sidebar: { width: 400 },
      detailsAutoOpenOnSelection: true,
    };
    await localForage.setItem("user-layout", oldData);

    await migrateUserLayoutIfNeeded();

    const migrated = await localForage.getItem("graph-view-layout");
    expect(migrated).toStrictEqual(oldData);
  });

  it("should not overwrite an existing graph-view-layout", async () => {
    const oldData = { activeSidebarItem: "search" };
    const newData = { activeSidebarItem: "details" };
    await localForage.setItem("user-layout", oldData);
    await localForage.setItem("graph-view-layout", newData);

    await migrateUserLayoutIfNeeded();

    const result = await localForage.getItem("graph-view-layout");
    expect(result).toStrictEqual(newData);
  });

  it("should leave the old key in place", async () => {
    const oldData = { activeSidebarItem: "search" };
    await localForage.setItem("user-layout", oldData);

    await migrateUserLayoutIfNeeded();

    const old = await localForage.getItem("user-layout");
    expect(old).toStrictEqual(oldData);
  });

  it("should do nothing when no old key exists", async () => {
    await migrateUserLayoutIfNeeded();

    const result = await localForage.getItem("graph-view-layout");
    expect(result).toBeNull();
  });
});
