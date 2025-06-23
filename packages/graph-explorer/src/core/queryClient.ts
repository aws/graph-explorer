import { Explorer } from "@/connector";
import { logger, NetworkError } from "@/utils";
import { QueryCache, QueryClient } from "@tanstack/react-query";

function exponentialBackoff(attempt: number): number {
  return Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000);
}

const MAX_RETRIES = 3;
const HTTP_STATUS_TO_NOT_RETRY = [400, 401, 403, 404, 429];

export interface GraphExplorerMeta extends Record<string, unknown> {
  explorer?: Explorer;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: GraphExplorerMeta;
    mutationMeta: GraphExplorerMeta;
  }
}

/**
 * Creates a new query client with the given explorer.
 * @param explorer The explorer to use for the query client.
 * @returns A new query client.
 */
export function createQueryClient({ explorer }: { explorer: Explorer }) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        meta: {
          explorer,
        } as const,
        retry: (failureCount, error) => {
          if (failureCount >= MAX_RETRIES) {
            return false;
          }
          if (
            error instanceof NetworkError &&
            HTTP_STATUS_TO_NOT_RETRY.includes(error.statusCode)
          ) {
            logger.debug(
              "Aborting retry due to HTTP status code:",
              error.statusCode
            );
            return false;
          }
          return true;
        },
        retryDelay: exponentialBackoff,
        staleTime: 1000 * 60 * 5, // 5 minute cache
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({
      onError(error, query) {
        logger.error("Query failed to execute:", query.queryKey, error);
      },
    }),
  });
}
