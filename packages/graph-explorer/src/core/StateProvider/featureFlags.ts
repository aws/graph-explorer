import { atom, type ExtractAtomValue, useAtomValue } from "jotai";
import { allowLoggingDbQueryAtom, showDebugActionsAtom } from "./storageAtoms";

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
