import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  KeyboardKey,
  LoadingSpinner,
  PanelEmptyState,
  PanelError,
  TextArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components";
import {
  useExplorer,
  useQueryEngine,
  useUpdateSchemaFromEntities,
} from "@/core";
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { ListIcon, SendHorizonalIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/utils";
import { useAtom } from "jotai";
import { SearchResultsList } from "./SearchResultsList";
import { atomWithReset } from "jotai/utils";
import {
  MappedQueryResults,
  updateEdgeDetailsCache,
  updateVertexDetailsCache,
} from "@/connector";
import { useRef } from "react";

const formDataSchema = z.object({
  query: z.string().default(""),
});

type FormData = z.infer<typeof formDataSchema>;

/**
 * Stores the current query text.
 *
 * This is used to restore the query text when the user switches tabs in the
 * sidebar, which forces React to create this view from scratch.
 */
export const queryTextAtom = atomWithReset("");

export function QuerySearchTabContent() {
  const [queryText, setQueryText] = useAtom(queryTextAtom);
  const { executeQuery, cancel } = useRawQueryMutation();
  const queryEngine = useQueryEngine();

  const form = useForm({
    resolver: zodResolver(formDataSchema),
    defaultValues: {
      query: queryText,
    },
  });

  // Execute the query when the form is submitted
  const onSubmit = async (data: FormData) => {
    logger.debug("Executing query:", data);
    setQueryText(data.query);
    await executeQuery(data.query);
  };

  // Submit the form when the user presses cmd+enter or ctrl+enter
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (form.formState.isSubmitting) {
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  // Create an appropriate placeholder to use in the query editor
  const queryPlaceholder = (() => {
    switch (queryEngine) {
      case "gremlin":
        return "e.g. g.V().limit(10)";
      case "openCypher":
        return "e.g. MATCH (n) RETURN n LIMIT 10";
      case "sparql":
        return "Not supported";
    }
  })();

  return (
    <div className="bg-background-default flex h-full flex-col">
      <Form {...form}>
        <form
          className="border-divider shrink-0 space-y-3 border-b p-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="space-y-0 p-[1px]">
                <FormControl>
                  <TextArea
                    {...field}
                    aria-label="Query"
                    className="h-full min-h-[5lh] w-full font-mono text-sm"
                    placeholder={queryPlaceholder}
                    onKeyDown={onKeyDown}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  Run Query
                  <SendHorizonalIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <KeyboardKey>Cmd</KeyboardKey> +{" "}
                <KeyboardKey>Enter</KeyboardKey> or{" "}
                <KeyboardKey>Ctrl</KeyboardKey> +{" "}
                <KeyboardKey>Enter</KeyboardKey>
              </TooltipContent>
            </Tooltip>
          </div>
        </form>
      </Form>

      <SearchResultsListContainer
        cancel={cancel}
        retry={() => executeQuery(queryText)}
      />
    </div>
  );
}

function SearchResultsListContainer({
  cancel,
  retry,
}: {
  cancel: () => void;
  retry: () => void;
}) {
  /*
   * DEV NOTE: This is a bit hacky. We use the mutation key to retrieve the
   * cached results of all mutations that have run before. The last one is the
   * most recent. So we use that to display results.
   *
   * This is necessary to restore query results if the component is unmounted
   * and re-mounted. For example if the user switches sidebar tabs or closes the
   * sidebar.
   */
  const { mutationKey } = useRawQueryMutation();
  const mutations = useMutationState({
    filters: {
      mutationKey,
    },
  });
  // Gets the last mutation from the array
  const mutation = mutations.at(-1);

  // Empty state
  if (!mutation) {
    return <QueryTabEmptyState />;
  }

  // Loading
  if (mutation.status === "pending") {
    return <QueryTabLoading cancel={cancel} />;
  }

  // Error
  if (mutation.status === "error" && !mutation.data && mutation.error) {
    // Cancellation should lead to empty state
    if (mutation.error.name === "AbortError") {
      return <QueryTabEmptyState />;
    }
    return (
      <PanelError error={mutation.error} onRetry={retry} className="p-8" />
    );
  }

  const mappedResults = mutation.data as MappedQueryResults;

  // No results
  if (
    mappedResults.vertices.length === 0 &&
    mappedResults.edges.length === 0 &&
    mappedResults.scalars.length === 0
  ) {
    return <QueryTabNoResults />;
  }

  return <SearchResultsList {...mappedResults} />;
}

function QueryTabLoading({ cancel }: { cancel: () => void }) {
  return (
    <PanelEmptyState
      title="Executing query..."
      icon={<LoadingSpinner />}
      className="p-8"
      actionLabel="Cancel"
      onAction={cancel}
    />
  );
}

function QueryTabEmptyState() {
  return (
    <PanelEmptyState
      title="Search Query"
      subtitle="Run a query to see results"
      icon={<SendHorizonalIcon />}
      className="p-8"
    />
  );
}

function QueryTabNoResults() {
  return (
    <PanelEmptyState
      title="No Results"
      subtitle="Your query executed successfully, but no results were included in the response."
      icon={<ListIcon />}
      className="p-8"
    />
  );
}

/**
 * Execute raw queries against the database using a mutation.
 *
 * This is implemented as a mutation to prevent accidental duplicate query
 * execution due to React re-renders or cache miss. This is important because
 * mutations can be executed and if they are executed more than once, could lead
 * to undesirable outcomes.
 */
function useRawQueryMutation() {
  const explorer = useExplorer();
  const queryClient = useQueryClient();
  const updateSchema = useUpdateSchemaFromEntities();

  const abortControllerRef = useRef<AbortController | null>(null);

  /** Cancels the active request */
  const cancel = () => {
    logger.debug("Cancelling query");
    abortControllerRef.current?.abort();
  };

  // This key ensures we can access the cached results
  const mutationKey = ["db", "raw-query", explorer];
  const mutation = useMutation({
    mutationKey: mutationKey,
    gcTime: Infinity,
    scope: { id: "raw-query" },
    mutationFn: async (query: string) => {
      // Create the abort controller and assign to the ref so the request can be cancelled
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const results = await explorer.rawQuery(
        { query },
        { signal: abortController.signal }
      );

      // Update the schema and the cache
      updateVertexDetailsCache(explorer, queryClient, results.vertices);
      updateEdgeDetailsCache(explorer, queryClient, results.edges);
      updateSchema(results);

      return results;
    },
  });

  const executeQuery = (query: string) => mutation.mutateAsync(query);

  return {
    executeQuery,
    cancel,
    mutationKey,
  };
}
