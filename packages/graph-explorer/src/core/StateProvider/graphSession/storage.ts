import { atom } from "jotai";
import { atomWithReset, RESET } from "jotai/utils";
import { z } from "zod";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  createVertexId,
} from "@/core";
import {
  DEFAULT_GRAPH_LAYOUT,
  isLayoutName,
  type LayoutName,
} from "@/core/graphLayout";
import { logger } from "@/utils";

import type { EdgeId, VertexId } from "../../entities";
import type { GraphArrangement } from "./arrangement";

/** A model for the graph data that is stored in local storage. */
export type GraphSessionStorageModel = {
  vertices: Set<VertexId>;
  edges: Set<EdgeId>;
  layout?: LayoutName;
  arrangement?: GraphArrangement;
};

export const isRestorePreviousSessionAvailableAtom = atomWithReset(true);

/** Gets or sets the active connection's graph session data. */
export const activeGraphSessionAtom = atom(
  get => {
    const connectionId = get(activeConfigurationAtom);

    if (!connectionId) {
      return null;
    }

    const graphs = get(allGraphSessionsAtom);
    return graphs.get(connectionId) ?? null;
  },
  (get, set, newValue: GraphSessionStorageModel | typeof RESET) => {
    const graphs = get(allGraphSessionsAtom);
    const connectionId = get(activeConfigurationAtom);

    // Do nothing if there is no active connection
    if (!connectionId) {
      return;
    }

    const newGraphs = new Map(graphs);

    // Delete the active graph if we receive a default value
    if (newValue === RESET || !newValue) {
      newGraphs.delete(connectionId);
      set(allGraphSessionsAtom, newGraphs);
      return;
    }

    newGraphs.set(connectionId, newValue);
    set(allGraphSessionsAtom, newGraphs);
  },
);

export function resolveGraphSessionLayout(
  value: unknown,
): LayoutName | undefined {
  if (value == null) return undefined;
  if (isLayoutName(value)) return value;
  logger.debug(
    `[graph-session] Unrecognized saved layout algorithm; using "${DEFAULT_GRAPH_LAYOUT}"`,
    value,
  );
  return DEFAULT_GRAPH_LAYOUT;
}

const finiteNumberSchema = z.number().finite();

const graphArrangementSchema = z
  .object({
    positions: z.array(
      z.object({
        id: z
          .union([z.string(), z.number()])
          .transform(value => createVertexId(value)),
        x: finiteNumberSchema,
        y: finiteNumberSchema,
      }),
    ),
    viewport: z
      .object({
        pan: z.object({
          x: finiteNumberSchema,
          y: finiteNumberSchema,
        }),
        zoom: finiteNumberSchema,
      })
      .optional(),
  })
  .superRefine((arrangement, context) => {
    const seen = new Set<string>();
    arrangement.positions.forEach((position, index) => {
      const key = `${typeof position.id}:${position.id}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate node position id",
          path: ["positions", index, "id"],
        });
      }
      seen.add(key);
    });
  });

export function sanitizeGraphArrangement(
  value: unknown,
): GraphArrangement | undefined {
  const result = graphArrangementSchema.safeParse(value);
  if (result.success) {
    return result.data as GraphArrangement;
  }
  logger.warn(
    "[graph-session] Dropping invalid persisted arrangement",
    result.error,
  );
  return undefined;
}

export function transformGraphSessions<ConnectionId>(
  sessions: Map<ConnectionId, GraphSessionStorageModel>,
): Map<ConnectionId, GraphSessionStorageModel> {
  let transformed: Map<ConnectionId, GraphSessionStorageModel> | undefined;

  for (const [connectionId, session] of sessions) {
    const layout = resolveGraphSessionLayout(session.layout);
    const arrangement =
      session.arrangement == null
        ? session.arrangement
        : sanitizeGraphArrangement(session.arrangement);

    if (layout === session.layout && arrangement === session.arrangement) {
      continue;
    }

    transformed ??= new Map(sessions);
    transformed.set(connectionId, { ...session, layout, arrangement });
  }

  return transformed ?? sessions;
}
