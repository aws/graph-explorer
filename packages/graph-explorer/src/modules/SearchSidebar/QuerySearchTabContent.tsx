import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  LoadingSpinner,
  PanelEmptyState,
  PanelError,
  SearchSadIcon,
  TextArea,
} from "@/components";
import { useExplorer, useUpdateSchemaFromEntities } from "@/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerDownRightIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/utils";
import { useAtom } from "jotai";
import { SearchResultsList } from "./SearchResultsList";
import { atomWithReset } from "jotai/utils";
import { updateEdgeDetailsCache, updateVertexDetailsCache } from "@/connector";
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
  const { mutation, cancel } = useRawQueryMutation();

  const form = useForm({
    resolver: zodResolver(formDataSchema),
    defaultValues: {
      query: queryText,
    },
  });

  // Execute the query when the form is submitted
  const onSubmit = (data: FormData) => {
    logger.debug("Executing query:", data);
    setQueryText(data.query);
    mutation.mutate(data.query);
  };

  // Submit the form when the user presses cmd+enter or ctrl+enter
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

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
                    placeholder="e.g. g.V().limit(10)"
                    onKeyDown={onKeyDown}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex gap-3">
            <Button className="w-full" variant="filled" type="submit">
              <CornerDownRightIcon />
              Run query
            </Button>
          </div>
        </form>
      </Form>

      <SearchResultsListContainer
        mutation={mutation}
        cancel={cancel}
        retry={() => mutation.mutate(queryText)}
      />
    </div>
  );
}

function SearchResultsListContainer({
  mutation,
  cancel,
  retry,
}: {
  mutation: RawQueryMutationResult;
  cancel: () => void;
  retry: () => void;
}) {
  if (mutation.isPending) {
    return (
      <PanelEmptyState
        title="Executing query..."
        icon={<LoadingSpinner />}
        className="p-8"
        actionLabel="Cancel"
        onAction={() => cancel()}
      />
    );
  }

  if (
    mutation.isError &&
    !mutation.data &&
    mutation.error.name !== "AbortError"
  ) {
    return (
      <PanelError error={mutation.error} onRetry={retry} className="p-8" />
    );
  }

  if (
    !mutation.data ||
    (mutation.data.vertices.length === 0 &&
      mutation.data.edges.length === 0 &&
      mutation.data.scalars.length === 0)
  ) {
    return (
      <PanelEmptyState
        title="No Results"
        subtitle="Your query does not produce any results"
        icon={<SearchSadIcon />}
        className="p-8"
      />
    );
  }

  return <SearchResultsList {...mutation.data} />;
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

  const mutation = useMutation({
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

  return {
    mutation,
    cancel,
  };
}

type RawQueryMutationResult = ReturnType<
  typeof useRawQueryMutation
>["mutation"];
