import { useAtomCallback } from "jotai/utils";

import type { ConfigurationId } from "@/core/ConfigurationProvider";

import type { GraphSessionStorageModel } from "./storage";

import { allGraphSessionsAtom } from "../storageAtoms";
import { arrangementsEqual, type GraphArrangement } from "./arrangement";

export function useSaveGraphArrangement() {
  return useAtomCallback(
    (
      get,
      set,
      target: ConfigurationId,
      expectedSession: GraphSessionStorageModel,
      arrangement: GraphArrangement,
    ) => {
      const sessions = get(allGraphSessionsAtom);
      if (
        sessions.get(target) !== expectedSession ||
        expectedSession.vertices.size === 0 ||
        arrangementsEqual(expectedSession.arrangement, arrangement)
      ) {
        return;
      }

      const updatedSessions = new Map(sessions);
      updatedSessions.set(target, { ...expectedSession, arrangement });
      set(allGraphSessionsAtom, updatedSessions);
    },
  );
}
