import type {
  ConfigurationId,
  RawConfiguration,
} from "../ConfigurationProvider";
import {
  defaultUserLayout,
  type GraphSessionStorageModel,
  type SchemaInference,
  type UserStyling,
} from "./index";
import { atomWithLocalForage } from "./atomWithLocalForage";

const [
  activeConfigurationAtom,
  configurationAtom,
  schemaAtom,
  userStylingAtom,
  userLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
] = await Promise.all([
  atomWithLocalForage<ConfigurationId | null>("active-configuration", null),
  atomWithLocalForage<Map<ConfigurationId, RawConfiguration>>(
    "configuration",
    new Map(),
  ),
  /** All the stored schemas */
  atomWithLocalForage("schema", new Map<string, SchemaInference>()),
  atomWithLocalForage<UserStyling>("user-styling", {}),
  atomWithLocalForage("user-layout", defaultUserLayout),
  /** Stores the graph session data for each connection. */
  atomWithLocalForage<Map<ConfigurationId, GraphSessionStorageModel>>(
    "graph-sessions",
    new Map(),
  ),
  /*
   * General App Settings
   */
  /** Shows debug actions in various places around the app. */
  atomWithLocalForage<boolean>("showDebugActions", false),
  /** Shows debug actions in various places around the app. */
  atomWithLocalForage<boolean>("allowLoggingDbQuery", false),
  /** Setting that enables/disables the default limit for neighbor expansion. */
  atomWithLocalForage<boolean>("defaultNeighborExpansionLimitEnabled", true),
  /** Setting that defines the default limit for neighbor expansion. */
  atomWithLocalForage<number>("defaultNeighborExpansionLimit", 10),
]);

export {
  activeConfigurationAtom,
  configurationAtom,
  schemaAtom,
  userStylingAtom,
  userLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
};
