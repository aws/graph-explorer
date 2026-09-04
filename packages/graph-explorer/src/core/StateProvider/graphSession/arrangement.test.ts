import { createNewConfigurationId, createVertexId } from "@/core";

import {
  arrangementsEqual,
  createPendingGraphRestoration,
  getGraphRestorationForTarget,
} from "./arrangement";

const arrangement = {
  positions: [{ id: createVertexId(1), x: 10, y: 20 }],
  viewport: { pan: { x: 30, y: 40 }, zoom: 2 },
};

test("compares positions and viewport exactly", () => {
  expect(arrangementsEqual(arrangement, structuredClone(arrangement))).toBe(
    true,
  );
  expect(
    arrangementsEqual(arrangement, {
      ...arrangement,
      viewport: { ...arrangement.viewport, zoom: 3 },
    }),
  ).toBe(false);
  expect(
    arrangementsEqual(arrangement, {
      ...arrangement,
      positions: [{ ...arrangement.positions[0], x: 11 }],
    }),
  ).toBe(false);
});

test("distinguishes absent and present viewports", () => {
  expect(
    arrangementsEqual({ positions: arrangement.positions }, arrangement),
  ).toBe(false);
});

test("creates unique monotonic target-scoped restoration revisions", () => {
  const target = createNewConfigurationId();
  const first = createPendingGraphRestoration(target, arrangement);
  const second = createPendingGraphRestoration(target, arrangement);

  expect(second.revision).toBeGreaterThan(first.revision);
  expect(first.target).toBe(target);
  expect(second.target).toBe(target);
});

test("does not expose a restoration to a stale connection target", () => {
  const originalTarget = createNewConfigurationId();
  const activeTarget = createNewConfigurationId();
  const restoration = createPendingGraphRestoration(
    originalTarget,
    arrangement,
  );

  expect(
    getGraphRestorationForTarget(restoration, activeTarget),
  ).toBeUndefined();
  expect(getGraphRestorationForTarget(restoration, originalTarget)).toBe(
    restoration,
  );
});
