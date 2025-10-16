export const DEFAULT_SERVICE_TYPE = "neptune-db";
export const DEFAULT_FETCH_TIMEOUT = 240000;
export const DEFAULT_NODE_EXPAND_LIMIT = 500;
export const DEFAULT_CONCURRENT_REQUESTS_LIMIT = 10;
export const DEFAULT_BATCH_REQUEST_SIZE = 100;

/** The name of the special property representing the node ID */
export const RESERVED_ID_PROPERTY = "~id";

/** The name of the property representing the list of types of the node */
export const RESERVED_TYPES_PROPERTY = "types";

/** The root URL for the app used for reloading fresh. */
export const RELOAD_URL =
  import.meta.env.BASE_URL.substring(-1) !== "/"
    ? import.meta.env.BASE_URL + "/"
    : import.meta.env.BASE_URL;

/** Labels used in the UI */
export const LABELS = {
  /** The string "Graph Explorer". */
  APP_NAME: "Graph Explorer",
  /** Used as the label for the ID of a blank node in the node details or query results. */
  BLANK_NODE_ID: "Blank Node Id",
  /** Shown when a type is missing  */
  MISSING_TYPE: "---",
  /** Shown when a value is missing */
  MISSING_VALUE: "---",
} as const;

/** ASCII characters used in strings */
export const ASCII = {
  /** Non breaking space */
  NBSP: "\u00A0",
  /** Small arrow character */
  RSAQUO: "\u203A",
} as const;
