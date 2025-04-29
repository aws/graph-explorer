import { atom, selector, useRecoilValue } from "recoil";
import { localForageEffect } from "./StateProvider/localForageEffect";

/** Shows debug actions in various places around the app. */
export const showDebugActionsAtom = atom({
  key: "feature-flag-debug-actions",
  default: false,
  effects: [localForageEffect("showDebugActions")],
});

/** Shows debug actions in various places around the app. */
export const allowLoggingDbQueryAtom = atom({
  key: "feature-flag-db-query-logging",
  default: false,
  effects: [localForageEffect("allowLoggingDbQuery")],
});

export type FeatureFlags = {
  showDebugActions: boolean;
  allowLoggingDbQuery: boolean;
};

export const featureFlagsSelector = selector<FeatureFlags>({
  key: "feature-flags",
  get: ({ get }) => {
    return {
      showDebugActions: get(showDebugActionsAtom),
      allowLoggingDbQuery: get(allowLoggingDbQueryAtom),
    } satisfies FeatureFlags;
  },
});

export function useFeatureFlags() {
  return useRecoilValue(featureFlagsSelector);
}
