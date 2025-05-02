import { atom, useAtomValue } from "jotai";
import { atomWithLocalForage } from "./StateProvider/localForageEffect";

/** Shows debug actions in various places around the app. */
export const showDebugActionsAtom = atomWithLocalForage(
  false,
  "showDebugActions"
);

/** Shows debug actions in various places around the app. */
export const allowLoggingDbQueryAtom = atomWithLocalForage(
  false,
  "allowLoggingDbQuery"
);

export type FeatureFlags = {
  showDebugActions: boolean;
  allowLoggingDbQuery: boolean;
};

export const featureFlagsSelector = atom(get => {
  return {
    showDebugActions: get(showDebugActionsAtom),
    allowLoggingDbQuery: get(allowLoggingDbQueryAtom),
  } satisfies FeatureFlags;
});

export function useFeatureFlags() {
  return useAtomValue(featureFlagsSelector);
}
