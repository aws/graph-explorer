export const queryEngineOptions = ["gremlin", "openCypher", "sparql"] as const;
export type QueryEngine = (typeof queryEngineOptions)[number];

export const neptuneServiceTypeOptions = [
  "neptune-db",
  "neptune-graph",
] as const;
export type NeptuneServiceType = (typeof neptuneServiceTypeOptions)[number];

export type ConnectionConfig = {
  /**
   * Base URL to access to the database through HTTPs endpoints
   */
  url: string;
  /**
   * Choose between gremlin or sparQL engines.
   * By default, it uses gremlin
   */
  queryEngine?: QueryEngine;
  /**
   * If the service is Neptune,
   * all requests should be sent through the nodejs proxy-server.
   */
  proxyConnection?: boolean;
  /**
   * If it is Neptune, the URL of the database.
   */
  graphDbUrl?: string;
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
   */
  nodeExpansionLimit?: number;
};
