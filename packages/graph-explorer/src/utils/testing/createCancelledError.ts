import { QueryClient } from "@tanstack/react-query";

/**
 * Creates an instance of the TanStack Query CancelledError that is thrown by
 * `fetchQuery` when the query is cancelled.
 */
export async function createCancelledError() {
  try {
    const queryClient = new QueryClient();
    // An infinitely running query
    const promise = queryClient.fetchQuery({
      queryKey: ["test"],
      queryFn: () => new Promise(() => {}),
    });
    // Cancel, then await the query to get the error
    queryClient.cancelQueries();
    await promise;
  } catch (error) {
    return error;
  }
}
