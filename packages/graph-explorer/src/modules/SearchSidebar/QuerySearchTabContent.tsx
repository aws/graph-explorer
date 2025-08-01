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
import { useQueryEngine, useUpdateSchemaFromEntities } from "@/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListIcon, SendHorizonalIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isCancellationError, logger } from "@/utils";
import { useAtom, useAtomValue } from "jotai";
import { SearchResultsList } from "./SearchResultsList";
import { atomWithReset } from "jotai/utils";
import { executeQuery } from "@/connector";

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
  const { submitQuery, cancel } = useExecuteQuery();
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
    try {
      await submitQuery(data.query);
    } catch (error) {
      if (isCancellationError(error)) {
        logger.debug("Query execution was cancelled, ignoring the error");
        return;
      }
      logger.error("Failed to execute query", { query: data.query, error });
    }
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

      <SearchResultsListContainer cancel={cancel} />
    </div>
  );
}

function SearchResultsListContainer({ cancel }: { cancel: () => void }) {
  /*
   * DEV NOTE: This is a bit hacky. We use the mutation key to retrieve the
   * cached results of all mutations that have run before. The last one is the
   * most recent. So we use that to display results.
   *
   * This is necessary to restore query results if the component is unmounted
   * and re-mounted. For example if the user switches sidebar tabs or closes the
   * sidebar.
   */
  const queryText = useAtomValue(queryTextAtom);
  const updateSchema = useUpdateSchemaFromEntities();

  // This query is disabled and can only be fired manually
  const query = useQuery(executeQuery(queryText, updateSchema));

  // Loading
  if (query.isLoading) {
    return <QueryTabLoading cancel={cancel} />;
  }

  // Error (other than cancellation)
  if (query.isError && !isCancellationError(query.error)) {
    return (
      <PanelError error={query.error} onRetry={query.refetch} className="p-8" />
    );
  }

  // Empty state
  if (!query.data) {
    return <QueryTabEmptyState />;
  }

  const mappedResults = query.data;

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
      title="Empty Results"
      subtitle="Your query executed successfully, but the result was empty."
      icon={<ListIcon />}
      className="p-8"
    />
  );
}

function useExecuteQuery() {
  const queryClient = useQueryClient();
  const updateSchema = useUpdateSchemaFromEntities();

  /** Cancels the active query request */
  const cancel = () => {
    logger.debug("Cancelling query");
    queryClient
      .cancelQueries({ queryKey: ["execute"] })
      .catch(err => logger.error("Failed to cancel query", err));
  };

  // Execute the query, ignoring any cached values
  const submitQuery = (query: string) =>
    queryClient.fetchQuery({
      ...executeQuery(query, updateSchema),
      staleTime: 0,
    });

  return { cancel, submitQuery };
}
