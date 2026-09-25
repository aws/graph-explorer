export const queryEngineOptions = ["gremlin", "openCypher", "sparql"] as const;
export type QueryEngine = (typeof queryEngineOptions)[number];

export const neptuneServiceTypeOptions = [
  "neptune-db",
  "neptune-graph",
] as const;
export type NeptuneServiceType = (typeof neptuneServiceTypeOptions)[number];

export type ConnectionConfig = {
  /**
   * The URL of the graph database endpoint.
   */
  graphDbUrl: string;
  /**
   * Choose between gremlin or sparQL engines.
   * By default, it uses gremlin
   */
  queryEngine?: QueryEngine;
  /**
   * If it is Neptune, it could need authentication.
   */
  awsAuthEnabled?: boolean;
  /**
   * If it is Neptune, it could need authentication.
   */
  serviceType?: NeptuneServiceType;
  /**
   * AWS Region where the Neptune cluster is deployed.
   * It is needed to sign requests.
   */
  awsRegion?: string;
  /**
   * Number of milliseconds before aborting a request.
   * By default, undefined.
   */
  fetchTimeoutMs?: number;
  /**
   * A default limit on the number of nodes that can be expanded in one query.
   * By default, undefined.
   *
   * This value overrides the app wide default limit.
   */
  nodeExpansionLimit?: number;
};

/** Legacy connection config that may still exist in stored data. */
export type LegacyConnectionConfig = Omit<ConnectionConfig, "graphDbUrl"> & {
  graphDbUrl?: string;
  url?: string;
  proxyConnection?: boolean;
};
