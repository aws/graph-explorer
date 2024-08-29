import { atom } from "recoil";
import { asyncLocalForageEffect } from "./StateProvider/localForageEffect";

/** Shows Recoil diff logs in the browser console. */
export const showRecoilStateLoggingAtom = atom({
  key: "feature-flag-recoil-state-logging",
  default: false,
  effects: [asyncLocalForageEffect("showRecoilStateLogging")],
});

/** Shows debug actions in various places around the app. */
export const showDebugActionsAtom = atom({
  key: "feature-flag-debug-actions",
  default: false,
  effects: [asyncLocalForageEffect("showDebugActions")],
});

/** Shows debug actions in various places around the app. */
export const allowLoggingDbQueryAtom = atom({
  key: "feature-flag-db-query-logging",
  default: false,
  effects: [asyncLocalForageEffect("allowLoggingDbQuery")],
});
