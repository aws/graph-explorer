import { createRandomName } from "@shared/utils/testing";

import type {
  ConfigurationId,
  RawConfiguration,
} from "@/core/ConfigurationProvider";
import type { EdgeType, VertexType } from "@/core/entities";
import type { GraphSessionStorageModel } from "@/core/StateProvider/graphSession/storage";
import type { SchemaStorageModel } from "@/core/StateProvider/schema";
import type {
  EdgePreferencesStorageModel,
  VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { reconcileMapByKey } from "@/core/StateProvider/atomWithLocalForage";

import { openPersistenceTab, readPersistedValue } from "./persistence";
import {
  createRandomConfigurationId,
  createRandomEdgeId,
  createRandomEdgeType,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexId,
  createRandomVertexType,
} from "./randomData";

type VertexStyles = Map<VertexType, VertexPreferencesStorageModel>;
type EdgeStyles = Map<EdgeType, EdgePreferencesStorageModel>;

describe("persistence test helpers", () => {
  test("a tab reads back the value it persisted", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    tab.write("updated");

    expect(tab.read()).toBe("updated");
  });

  test("flush waits for the value to land in storage", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    tab.write("updated");
    await tab.flush();

    expect(await readPersistedValue(key)).toBe("updated");
  });

  test("flush waits for rapid successive writes to settle", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    // Fire several writes without awaiting each, then flush once. The queue
    // coalesces them, so only the latest value lands.
    tab.write("first");
    tab.write("second");
    tab.write("third");
    await tab.flush();

    expect(await readPersistedValue(key)).toBe("third");
  });

  test("a tab opened later preloads what an earlier tab persisted", async () => {
    const key = createRandomName("key");
    const firstTab = await openPersistenceTab(key, "initial");
    firstTab.write("from-first-tab");
    await firstTab.flush();

    const secondTab = await openPersistenceTab(key, "initial");

    expect(secondTab.read()).toBe("from-first-tab");
  });

  test("two tabs over the same key share one storage backend", async () => {
    const key = createRandomName("key");
    const tabA = await openPersistenceTab(key, "initial");
    const tabB = await openPersistenceTab(key, "initial");

    tabA.write("written-by-a");
    await tabA.flush();

    // Tab B holds its own stale in-memory copy until it reloads, but the shared
    // storage already reflects Tab A's write.
    expect(tabB.read()).toBe("initial");
    expect(await readPersistedValue(key)).toBe("written-by-a");
  });

  test("readPersistedValue returns null when nothing was persisted", async () => {
    const key = createRandomName("key");

    expect(await readPersistedValue(key)).toBeNull();
  });
});

/**
 * Guards the per-test IndexedDB reset in `setupTests.ts`. These two tests share
 * a FIXED key on purpose: random keys would pass even if isolation were broken,
 * because each test would read a key the previous one never wrote. The fixed
 * key forces the second test to observe whether the first test's persisted
 * write actually bled through.
 */
describe("per-test storage isolation", () => {
  const sharedKey = "shared-isolation-key";

  test("first test persists a value under the shared key", async () => {
    const tab = await openPersistenceTab(sharedKey, "initial");
    tab.write("written-by-first-test");
    await tab.flush();

    expect(await readPersistedValue(sharedKey)).toBe("written-by-first-test");
  });

  test("second test does not see the first test's persisted value", async () => {
    expect(await readPersistedValue(sharedKey)).toBeNull();
  });
});

/**
 * REGRESSION — #1820 cross-tab styling clobber, fixed by #1831
 *
 * Two tabs share one IndexedDB but each keeps its own in-memory copy of the
 * vertex styling map. Without reconciliation, the whole map is written back on
 * every change, so a tab with a stale in-memory copy silently drops entries
 * another tab added.
 *
 * Scenario from the issue: Tab A styles vertex type X and persists it. Tab B —
 * opened before that write and never having seen X — styles type Y and persists
 * its stale map. With the per-key map merge wired into the styling atoms, both
 * types survive instead of X being clobbered.
 */
describe("cross-tab user styling reconciliation", () => {
  test("preserves vertex styling when one tab writes against a stale memory copy", async () => {
    const key = createRandomName("user-vertex-styles");
    const typeX = createRandomVertexType();
    const typeY = createRandomVertexType();

    const styleForType = (type: VertexType): VertexPreferencesStorageModel => ({
      type,
      color: "#ff0000",
    });

    // Both tabs open against empty styling, using the same reconciler the real
    // styling atoms are wired with.
    const tabA = await openPersistenceTab<VertexStyles>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const tabB = await openPersistenceTab<VertexStyles>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    // Tab A styles type X and persists.
    tabA.write(prev => new Map(prev).set(typeX, styleForType(typeX)));
    await tabA.flush();

    // Tab B, still holding its stale empty copy, styles type Y and persists.
    tabB.write(prev => new Map(prev).set(typeY, styleForType(typeY)));
    await tabB.flush();

    const persisted = await readPersistedValue<VertexStyles>(key);

    expect(new Set(persisted?.keys())).toEqual(new Set([typeX, typeY]));
  });

  test("preserves edge styling when one tab writes against a stale memory copy", async () => {
    const key = createRandomName("user-edge-styles");
    const typeX = createRandomEdgeType();
    const typeY = createRandomEdgeType();

    const styleForType = (type: EdgeType): EdgePreferencesStorageModel => ({
      type,
      lineColor: "#ff0000",
    });

    const tabA = await openPersistenceTab<EdgeStyles>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const tabB = await openPersistenceTab<EdgeStyles>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    tabA.write(prev => new Map(prev).set(typeX, styleForType(typeX)));
    await tabA.flush();

    tabB.write(prev => new Map(prev).set(typeY, styleForType(typeY)));
    await tabB.flush();

    const persisted = await readPersistedValue<EdgeStyles>(key);

    expect(new Set(persisted?.keys())).toEqual(new Set([typeX, typeY]));
  });
});

/**
 * REGRESSION — #1820 cross-tab schema clobber
 *
 * The schema atom stores `Map<ConfigurationId, SchemaStorageModel>` — one entry
 * per connection. Two tabs each hold their own in-memory copy of that map, so a
 * tab that syncs one connection's schema would, on a blind whole-map write,
 * silently drop a schema another tab discovered for a different connection. The
 * same per-key map merge protects it.
 */
describe("cross-tab schema reconciliation", () => {
  test("preserves schemas when one tab writes against a stale memory copy", async () => {
    const key = createRandomName("schema");
    const connectionA = createRandomName("connection");
    const connectionB = createRandomName("connection");
    const schemaA = createRandomSchema();
    const schemaB = createRandomSchema();

    type SchemaMap = Map<string, SchemaStorageModel>;

    const tabA = await openPersistenceTab<SchemaMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const tabB = await openPersistenceTab<SchemaMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    // Tab A discovers connection A's schema and persists.
    tabA.write(prev => new Map(prev).set(connectionA, schemaA));
    await tabA.flush();

    // Tab B, still holding its stale empty map, discovers connection B and
    // persists its stale map.
    tabB.write(prev => new Map(prev).set(connectionB, schemaB));
    await tabB.flush();

    const persisted = await readPersistedValue<SchemaMap>(key);

    expect(persisted?.get(connectionA)).toEqual(schemaA);
    expect(persisted?.get(connectionB)).toEqual(schemaB);
  });
});

/**
 * REGRESSION — #1820 cross-tab connection clobber
 *
 * The configuration atom stores `Map<ConfigurationId, RawConfiguration>` — one
 * entry per connection. Creating a connection in one tab while another tab
 * holds a stale copy would, on a blind whole-map write, silently drop the
 * connection the other tab created. The same per-key map merge protects it.
 */
describe("cross-tab connection reconciliation", () => {
  test("preserves connections when one tab writes against a stale memory copy", async () => {
    const key = createRandomName("configuration");
    const connectionX = createRandomRawConfiguration();
    const connectionY = createRandomRawConfiguration();

    type ConfigMap = Map<ConfigurationId, RawConfiguration>;

    const tabA = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const tabB = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    // Tab A creates connection X and persists.
    tabA.write(prev => new Map(prev).set(connectionX.id, connectionX));
    await tabA.flush();

    // Tab B, still holding its stale empty map, creates connection Y.
    tabB.write(prev => new Map(prev).set(connectionY.id, connectionY));
    await tabB.flush();

    const persisted = await readPersistedValue<ConfigMap>(key);

    expect(persisted?.get(connectionX.id)).toEqual(connectionX);
    expect(persisted?.get(connectionY.id)).toEqual(connectionY);
  });

  test("drops a connection one tab removed while preserving a sibling another added", async () => {
    const key = createRandomName("configuration");
    const connectionX = createRandomRawConfiguration();
    const connectionY = createRandomRawConfiguration();
    const connectionZ = createRandomRawConfiguration();

    type ConfigMap = Map<ConfigurationId, RawConfiguration>;

    // Tab A creates connections X and Y, then a later tab preloads both.
    const tabA = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    tabA.write(
      new Map([
        [connectionX.id, connectionX],
        [connectionY.id, connectionY],
      ]),
    );
    await tabA.flush();

    // Tab B opens after that write, so it preloads {X, Y}.
    const tabB = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    // Another tab creates connection Z — Tab B never sees it.
    tabA.write(prev => new Map(prev).set(connectionZ.id, connectionZ));
    await tabA.flush();

    // Tab B removes connection X from its stale {X, Y} copy.
    tabB.write(prev => {
      const next = new Map(prev);
      next.delete(connectionX.id);
      return next;
    });
    await tabB.flush();

    const persisted = await readPersistedValue<ConfigMap>(key);

    // X is dropped (Tab B removed it), Y survives (untouched), and Z survives
    // even though Tab B never saw it — the removal merges onto live storage.
    expect(persisted?.has(connectionX.id)).toBe(false);
    expect(persisted?.get(connectionY.id)).toEqual(connectionY);
    expect(persisted?.get(connectionZ.id)).toEqual(connectionZ);
  });
});

/**
 * REGRESSION — #1820 cross-tab session clobber
 *
 * The graph-sessions atom stores `Map<ConfigurationId, GraphSessionStorageModel>`
 * — one session per connection. Concurrent session changes for different
 * connections must not clobber each other; the per-key map merge keeps each
 * connection's session intact.
 */
describe("cross-tab session reconciliation", () => {
  test("preserves sessions when one tab writes against a stale memory copy", async () => {
    const key = createRandomName("graph-sessions");
    const connectionA = createRandomConfigurationId();
    const connectionB = createRandomConfigurationId();
    const sessionA: GraphSessionStorageModel = {
      vertices: new Set([createRandomVertexId()]),
      edges: new Set([createRandomEdgeId()]),
    };
    const sessionB: GraphSessionStorageModel = {
      vertices: new Set([createRandomVertexId()]),
      edges: new Set([createRandomEdgeId()]),
    };

    type SessionMap = Map<ConfigurationId, GraphSessionStorageModel>;

    const tabA = await openPersistenceTab<SessionMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const tabB = await openPersistenceTab<SessionMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    // Tab A records connection A's session and persists.
    tabA.write(prev => new Map(prev).set(connectionA, sessionA));
    await tabA.flush();

    // Tab B, still holding its stale empty map, records connection B's session.
    tabB.write(prev => new Map(prev).set(connectionB, sessionB));
    await tabB.flush();

    const persisted = await readPersistedValue<SessionMap>(key);

    expect(persisted?.get(connectionA)).toEqual(sessionA);
    expect(persisted?.get(connectionB)).toEqual(sessionB);
  });
});

/**
 * The stale-memory scenarios above each await one tab's flush before the next
 * tab writes. These exercise the harder path: two writes still in flight when a
 * later write enters the same per-key queue, so the reconcile flush must merge
 * against in-progress live storage and the merge baseline must advance
 * correctly across coalesced drops.
 */
describe("cross-tab reconciliation under in-flight writes", () => {
  test("coalesces rapid same-tab writes while merging onto another tab's concurrent sibling", async () => {
    const key = createRandomName("configuration");
    const siblingConnection = createRandomRawConfiguration();
    const connectionX = createRandomRawConfiguration();
    const connectionY = createRandomRawConfiguration();
    const connectionZ = createRandomRawConfiguration();

    type ConfigMap = Map<ConfigurationId, RawConfiguration>;

    // A sibling tab persists its connection first, so it is already in storage
    // when this tab — which opened stale against an empty map — writes.
    const siblingTab = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const editingTab = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    siblingTab.write(new Map([[siblingConnection.id, siblingConnection]]));
    await siblingTab.flush();

    // Three rapid writes without awaiting between them. The write queue
    // coalesces pending flushes to the latest, dropping the intermediate one,
    // so the baseline must only advance for the writes that actually run for
    // the net per-key result to be correct.
    editingTab.write(new Map([[connectionX.id, connectionX]]));
    editingTab.write(prev => new Map(prev).set(connectionY.id, connectionY));
    editingTab.write(prev => new Map(prev).set(connectionZ.id, connectionZ));
    await editingTab.flush();

    const persisted = await readPersistedValue<ConfigMap>(key);

    expect(persisted?.get(siblingConnection.id)).toEqual(siblingConnection);
    expect(persisted?.get(connectionX.id)).toEqual(connectionX);
    expect(persisted?.get(connectionY.id)).toEqual(connectionY);
    expect(persisted?.get(connectionZ.id)).toEqual(connectionZ);
  });

  test("two tabs whose writes are still in flight both land without clobber", async () => {
    const key = createRandomName("configuration");
    const connectionA = createRandomRawConfiguration();
    const connectionB = createRandomRawConfiguration();

    type ConfigMap = Map<ConfigurationId, RawConfiguration>;

    const tabA = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );
    const tabB = await openPersistenceTab<ConfigMap>(
      key,
      new Map(),
      reconcileMapByKey,
    );

    // Both tabs write before either flush resolves — neither has seen the
    // other's write land in storage. The shared per-key write queue serializes
    // the two flushes, and the second flush's reconcile re-reads live storage
    // (now containing the first flush's output) and merges against its own
    // stale baseline, so both connections survive.
    tabA.write(new Map([[connectionA.id, connectionA]]));
    tabB.write(new Map([[connectionB.id, connectionB]]));
    await Promise.all([tabA.flush(), tabB.flush()]);

    const persisted = await readPersistedValue<ConfigMap>(key);

    expect(persisted?.get(connectionA.id)).toEqual(connectionA);
    expect(persisted?.get(connectionB.id)).toEqual(connectionB);
  });
});
