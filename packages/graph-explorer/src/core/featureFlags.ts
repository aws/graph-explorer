import { atom, type ExtractAtomValue, useAtomValue } from "jotai";
import { atomWithLocalForage } from "./StateProvider/atomWithLocalForage";

/** Shows debug actions in various places around the app. */
export const showDebugActionsAtom = await atomWithLocalForage<boolean>(
  "showDebugActions",
  false,
);

/** Shows debug actions in various places around the app. */
export const allowLoggingDbQueryAtom = await atomWithLocalForage<boolean>(
  "allowLoggingDbQuery",
  false,
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
export const defaultNeighborExpansionLimitEnabledAtom =
  await atomWithLocalForage<boolean>(
    "defaultNeighborExpansionLimitEnabled",
    true,
  );

/** Setting that defines the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitAtom =
  await atomWithLocalForage<number>("defaultNeighborExpansionLimit", 10);
