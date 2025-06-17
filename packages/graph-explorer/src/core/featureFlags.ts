import { atom, ExtractAtomValue, useAtomValue } from "jotai";
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

export const featureFlagsSelector = atom(get => {
  return {
    showDebugActions: get(showDebugActionsAtom),
    allowLoggingDbQuery: get(allowLoggingDbQueryAtom),
  };
});

export type FeatureFlags = ExtractAtomValue<typeof featureFlagsSelector>;

export function useFeatureFlags() {
  return useAtomValue(featureFlagsSelector);
}

/*
 * General App Settings
 */

/** Setting that enables/disables the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitEnabledAtom = atomWithLocalForage(
  true,
  "defaultNeighborExpansionLimitEnabled"
);

/** Setting that defines the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitAtom = atomWithLocalForage(
  10,
  "defaultNeighborExpansionLimit"
);
