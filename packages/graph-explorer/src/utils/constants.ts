export const DEFAULT_SERVICE_TYPE = "neptune-db";
export const DEFAULT_FETCH_TIMEOUT = 240000;
export const DEFAULT_NODE_EXPAND_LIMIT = 500;
export const DEFAULT_CONCURRENT_REQUESTS_LIMIT = 10;
export const DEFAULT_BATCH_REQUEST_SIZE = 100;

/** The name of the special property representing the node ID */
export const RESERVED_ID_PROPERTY = "~id";

/** The name of the property representing the list of types of the node */
export const RESERVED_TYPES_PROPERTY = "types";

/** The string "Graph Explorer". */
export const APP_NAME = "Graph Explorer";

/** The root URL for the app used for reloading fresh. */
export const RELOAD_URL =
  import.meta.env.BASE_URL.substring(-1) !== "/"
    ? import.meta.env.BASE_URL + "/"
    : import.meta.env.BASE_URL;

/** Shown when a value is missing */
export const MISSING_DISPLAY_VALUE = "---";

/** Shown when a type is missing  */
export const MISSING_DISPLAY_TYPE = "---";
