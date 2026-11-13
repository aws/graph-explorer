import type { QueryEngine } from "@shared/types";
import type { ReactNode } from "react";

import { revalidateLogic } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { SendHorizonalIcon, SendHorizontalIcon } from "lucide-react";
import { z } from "zod";

import {
  InputGroupButton,
  KeyboardKey,
  PanelEmptyState,
  PanelError,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components";
import { useAppForm } from "@/components/form";
import { useQueryEngine } from "@/connections";
import { executeUserQuery } from "@/connector";
import { useUpdateSchemaFromEntities } from "@/core";
import { isCancellationError, logger } from "@/utils";

import { SearchResultsList } from "./SearchResultsList";

const querySchema = z.object({ query: z.string() });

/**
 * Stores the current query text.
 *
 * This is used to restore the query text when the user switches tabs in the
 * sidebar, which forces React to create this view from scratch.
 */
export const queryTextAtom = atomWithReset("");

export function QuerySearchTabContent() {
  const queryText = useAtomValue(queryTextAtom);
  const setQueryText = useSetAtom(queryTextAtom);
  const queryEngine = useQueryEngine();
  const { submitQuery, cancel } = useExecuteQuery();

  const form = useAppForm({
    defaultValues: { query: queryText },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: querySchema },
    onSubmit: async ({ value }) => {
      const { query } = querySchema.parse(value);
      logger.debug("Executing query:", query);
      try {
        await submitQuery(query);
      } catch (error) {
        if (isCancellationError(error)) {
          logger.debug("Query execution was cancelled, ignoring the error");
          return;
        }
        logger.error("Failed to execute query", { query, error });
      }
    },
  });

  function submitFromKeyboard() {
    if (form.state.isSubmitting) {
      return;
    }
    void form.handleSubmit();
  }

  return (
    <div className="bg-background flex h-full flex-col">
      <form.AppForm>
        <form
          className="shrink-0 p-3"
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField
            name="query"
            listeners={{ onChange: ({ value }) => setQueryText(value) }}
          >
            {field => (
              <field.TextAreaFormField
                label="Query"
                hideLabel
                className="min-h-[5lh] flex-auto resize-y font-mono text-sm"
                placeholder={queryPlaceholder(queryEngine)}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submitFromKeyboard();
                  }
                }}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                addon={
                  <QuerySubmitTooltip>
                    <form.SubmitButton asChild>
                      <InputGroupButton
                        size="icon-sm"
                        variant="secondary"
                        className="ml-auto"
                      >
                        <span className="sr-only">Submit</span>
                        <SendHorizontalIcon />
                      </InputGroupButton>
                    </form.SubmitButton>
                  </QuerySubmitTooltip>
                }
              />
            )}
          </form.AppField>
        </form>
      </form.AppForm>

      <SearchResultsListContainer cancel={cancel} />
    </div>
  );
}

function QuerySubmitTooltip({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        Submit query (<KeyboardKey>Cmd</KeyboardKey> +{" "}
        <KeyboardKey>Enter</KeyboardKey> or <KeyboardKey>Ctrl</KeyboardKey> +{" "}
        <KeyboardKey>Enter</KeyboardKey>)
      </TooltipContent>
    </Tooltip>
  );
}

function queryPlaceholder(queryEngine: QueryEngine): string {
  switch (queryEngine) {
    case "gremlin":
      return "e.g. g.V().limit(10)";
    case "openCypher":
      return "e.g. MATCH (n) RETURN n LIMIT 10";
    case "sparql":
      return "e.g. CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10";
  }
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
  const query = useQuery(executeUserQuery(queryText, updateSchema));

  // Loading
  if (query.isFetching) {
    return <QueryTabLoading cancel={cancel} />;
  }

  // Error
  if (query.isError) {
    return isCancellationError(query.error) ? (
      <QueryTabEmptyState />
    ) : (
      <PanelError
        error={query.error}
        onRetry={() => void query.refetch()}
        className="p-8"
      />
    );
  }

  // Empty state
  if (!query.data) {
    return <QueryTabEmptyState />;
  }

  return (
    <SearchResultsList
      results={query.data.results}
      rawResponse={query.data.rawResponse}
    />
  );
}

function QueryTabLoading({ cancel }: { cancel: () => void }) {
  return (
    <PanelEmptyState
      title="Executing query..."
      icon={<Spinner />}
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

function useExecuteQuery() {
  const queryClient = useQueryClient();
  const updateSchema = useUpdateSchemaFromEntities();

  /** Cancels the active query request */
  const cancel = () => {
    logger.debug("Cancelling query");

    // Get the query key from the query options (parameters are not important)
    const { queryKey } = executeUserQuery("", () => {});

    // Reverting would restore the previous query's error as if it were current.
    queryClient
      .cancelQueries({ queryKey }, { revert: false })
      .catch(err => logger.error("Failed to cancel query", err));
  };

  // Execute the query, ignoring any cached values
  const submitQuery = (query: string) =>
    queryClient.fetchQuery({
      ...executeUserQuery(query, updateSchema),
      staleTime: 0,
    });

  return { cancel, submitQuery };
}
