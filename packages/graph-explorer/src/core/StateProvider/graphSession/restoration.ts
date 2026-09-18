import type { Getter, Setter } from "jotai";

import { atom } from "jotai";
import { RESET } from "jotai/utils";

import type { ConfigurationId } from "@/core/ConfigurationProvider";
import type { LayoutName } from "@/core/graphLayout";

import { activeConfigurationAtom } from "@/core";

import {
  createPendingGraphRestoration,
  mergeGraphArrangements,
  pendingGraphRestorationAtom,
  type GraphArrangement,
} from "./arrangement";
import { graphViewLayoutAlgorithmAtom } from "./graphViewLayoutAlgorithm";
import {
  activeGraphSessionAtom,
  isRestorePreviousSessionAvailableAtom,
  type GraphSessionStorageModel,
} from "./storage";
import { getGraphSessionFromCurrentGraph } from "./useUpdateGraphSession";

export type GraphRestorationRequest = {
  target: ConfigurationId;
  token: number;
};

export const graphRestorationRequestAtom = atom<GraphRestorationRequest | null>(
  null,
);

let nextRestorationToken = 0;

export function startGraphRestoration(
  set: Setter,
  target: ConfigurationId,
): number {
  nextRestorationToken += 1;
  const token = nextRestorationToken;
  set(graphRestorationRequestAtom, { target, token });
  set(pendingGraphRestorationAtom, null);
  return token;
}

export function isCurrentGraphRestoration(
  get: Getter,
  token: number,
  target: ConfigurationId,
): boolean {
  return (
    get(graphRestorationRequestAtom)?.token === token &&
    get(activeConfigurationAtom) === target
  );
}

export type GraphRestorationCommit = {
  token: number;
  target: ConfigurationId;
  layout?: LayoutName;
  arrangement?: GraphArrangement;
  source?: GraphSessionStorageModel;
};

export function commitGraphRestoration(
  get: Getter,
  set: Setter,
  commit: GraphRestorationCommit,
): boolean {
  if (!isCurrentGraphRestoration(get, commit.token, commit.target)) {
    return false;
  }

  if (commit.layout != null) {
    set(graphViewLayoutAlgorithmAtom, commit.layout);
  }

  const currentGraph = getGraphSessionFromCurrentGraph(get);
  const currentSession = get(activeGraphSessionAtom);
  const baseSession: GraphSessionStorageModel = commit.source
    ? { ...commit.source, layout: commit.source.layout ?? currentGraph.layout }
    : currentGraph;
  const baseArrangement =
    commit.source?.arrangement ?? currentSession?.arrangement;

  const finalArrangement =
    commit.arrangement != null && baseSession.vertices.size > 0
      ? mergeGraphArrangements(
          baseArrangement,
          commit.arrangement,
          baseSession.vertices,
        )
      : baseArrangement;

  const layout = commit.layout ?? baseSession.layout;

  if (baseSession.vertices.size === 0 && baseSession.edges.size === 0) {
    set(activeGraphSessionAtom, RESET);
  } else {
    set(activeGraphSessionAtom, {
      vertices: baseSession.vertices,
      edges: baseSession.edges,
      layout,
      arrangement: finalArrangement,
    });
  }

  set(isRestorePreviousSessionAvailableAtom, false);

  if (finalArrangement != null) {
    set(
      pendingGraphRestorationAtom,
      createPendingGraphRestoration(commit.target, finalArrangement),
    );
  }

  set(graphRestorationRequestAtom, null);

  return true;
}
