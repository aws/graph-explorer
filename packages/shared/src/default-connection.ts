import { z } from "zod";

import { DEFAULT_SERVICE_TYPE } from "./constants.ts";
import {
  neptuneServiceTypeOptions,
  queryEngineOptions,
} from "./types/index.ts";

/**
 * The Default Connection the server sends at `/defaultConnection` and the
 * client reads. The server types its payload with this schema's input.
 */
export const DefaultConnectionDataSchema = z.object({
  // Connection info
  GRAPH_EXP_USING_PROXY_SERVER: z.boolean().optional(),
  // An empty or invalid value counts as absent, so legacy inference falls
  // through to the public endpoint
  GRAPH_EXP_CONNECTION_URL: z.string().url().optional().catch(undefined),
  // Written by earlier versions, and read the way a legacy stored connection is
  GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: z.string().url().optional().catch(""),
  GRAPH_EXP_GRAPH_TYPE: z.enum(queryEngineOptions).optional(),
  // IAM auth info
  GRAPH_EXP_IAM: z.boolean().default(false),
  GRAPH_EXP_AWS_REGION: z.string().optional().default(""),
  GRAPH_EXP_SERVICE_TYPE: z
    .enum(neptuneServiceTypeOptions)
    .default(DEFAULT_SERVICE_TYPE)
    .catch(DEFAULT_SERVICE_TYPE),
  // Connection options
  GRAPH_EXP_FETCH_REQUEST_TIMEOUT: z.number().default(240000),
  GRAPH_EXP_NODE_EXPANSION_LIMIT: z.number().optional(),
});

export type DefaultConnectionData = z.infer<typeof DefaultConnectionDataSchema>;
