import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";
import {
  defaultUserLayout,
  type GraphSessionStorageModel,
  type SchemaInference,
  type UserStyling,
} from "./StateProvider";
import { atomWithLocalForage } from "./StateProvider/atomWithLocalForage";

export const activeConfigurationAtom =
  await atomWithLocalForage<ConfigurationId | null>(
    "active-configuration",
    null,
  );

export const configurationAtom = await atomWithLocalForage<
  Map<ConfigurationId, RawConfiguration>
>("configuration", new Map());

/** All the stored schemas */
export const schemaAtom = await atomWithLocalForage(
  "schema",
  new Map<string, SchemaInference>(),
);

export const userStylingAtom = await atomWithLocalForage<UserStyling>(
  "user-styling",
  {},
);

export const userLayoutAtom = await atomWithLocalForage(
  "user-layout",
  defaultUserLayout,
);
/** Stores the graph session data for each connection. */
export const allGraphSessionsAtom = await atomWithLocalForage<
  Map<ConfigurationId, GraphSessionStorageModel>
>("graph-sessions", new Map());

/*
 * General App Settings
 */

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

/** Setting that enables/disables the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitEnabledAtom =
  await atomWithLocalForage<boolean>(
    "defaultNeighborExpansionLimitEnabled",
    true,
  );

/** Setting that defines the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitAtom =
  await atomWithLocalForage<number>("defaultNeighborExpansionLimit", 10);
