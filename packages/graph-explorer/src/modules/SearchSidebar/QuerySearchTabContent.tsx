import {
  Form,
  FormControl,
  FormField,
  FormItem,
  IconButton,
  KeyboardKey,
  PanelEmptyState,
  PanelError,
  Spinner,
  TextArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components";
import { useQueryEngine, useUpdateSchemaFromEntities } from "@/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SendHorizonalIcon, SendHorizontalIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { cn, isCancellationError, logger } from "@/utils";
import { useAtom, useAtomValue } from "jotai";
import { SearchResultsList } from "./SearchResultsList";
import { atomWithReset } from "jotai/utils";
import { executeUserQuery } from "@/connector";
import type { ComponentPropsWithRef } from "react";

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

  const form = useForm({
    // Using standardSchemaResolver because Zod 4 implements Standard Schema spec
    // and zodResolver has compatibility issues with Zod 4.x
    resolver: standardSchemaResolver(formDataSchema),
    defaultValues: {
      query: queryText,
    },
  });

  // Sync form changes to Jotai atom in real-time
  const handleQueryChange = (value: string) => {
    setQueryText(value);
    form.setValue("query", value);
  };

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

  const onKeyboardShortcutSubmit = () => {
    if (form.formState.isSubmitting) {
      return;
    }
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="bg-background-default flex h-full flex-col">
      <Form {...form}>
        <form
          className="shrink-0 space-y-3 p-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="relative space-y-0">
                <FormControl>
                  <QueryTextArea
                    {...field}
                    onChange={e => handleQueryChange(e.target.value)}
                    className="pr-14"
                    onSubmit={onKeyboardShortcutSubmit}
                  />
                </FormControl>
                <QuerySubmitButton
                  className="absolute right-2 bottom-2"
                  disabled={form.formState.isSubmitting}
                />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <SearchResultsListContainer cancel={cancel} />
    </div>
  );
}

function QuerySubmitButton({
  ...props
}: ComponentPropsWithRef<typeof IconButton>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton variant="default" type="submit" {...props}>
          <span className="sr-only">Submit</span>
          <SendHorizontalIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>
        Submit query (<KeyboardKey>Cmd</KeyboardKey> +{" "}
        <KeyboardKey>Enter</KeyboardKey> or <KeyboardKey>Ctrl</KeyboardKey> +{" "}
        <KeyboardKey>Enter</KeyboardKey>)
      </TooltipContent>
    </Tooltip>
  );
}

function QueryTextArea({
  className,
  ...props
}: ComponentPropsWithRef<typeof TextArea> & { onSubmit: () => void }) {
  const queryEngine = useQueryEngine();

  // Submit the form when the user presses cmd+enter or ctrl+enter
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      props.onSubmit();
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
        return "e.g. CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10";
    }
  })();

  return (
    <TextArea
      {...props}
      aria-label="Query"
      className={cn("h-full min-h-[5lh] w-full font-mono text-sm", className)}
      placeholder={queryPlaceholder}
      onKeyDown={onKeyDown}
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="off"
    />
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
      <PanelError error={query.error} onRetry={query.refetch} className="p-8" />
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

    queryClient
      .cancelQueries({ queryKey })
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
