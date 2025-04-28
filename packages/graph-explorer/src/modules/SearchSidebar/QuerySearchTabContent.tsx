import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  Label,
  LoadingSpinner,
  PanelEmptyState,
  PanelError,
  SearchSadIcon,
  TextArea,
} from "@/components";
import { useExplorer, useUpdateSchemaFromEntities } from "@/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerDownRightIcon } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/utils";
import { atom, useRecoilState } from "recoil";
import { LoadedResults } from "./LoadedResults";
import { updateEdgeDetailsCache, updateVertexDetailsCache } from "@/connector";

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
export const queryTextAtom = atom({ key: "queryText", default: "" });

export function QuerySearchTabContent() {
  const [queryText, setQueryText] = useRecoilState(queryTextAtom);
  const mutation = useRawQueryMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(formDataSchema),
    defaultValues: {
      query: queryText,
    },
  });

  // Execute the query when the form is submitted
  const onSubmit = useCallback(
    (data: FormData) => {
      logger.debug("Executing query:", data);
      setQueryText(data.query);
      mutation.mutate(data.query);
    },
    [mutation, setQueryText]
  );

  // Submit the form when the user presses cmd+enter or ctrl+enter
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    },
    [form, onSubmit]
  );

  return (
    <div className="bg-background-default flex h-full flex-col">
      <Form {...form}>
        <form
          className="border-divider flex shrink-0 flex-col gap-3 border-b p-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="query" className="sr-only">
                  Query
                </Label>
                <FormControl>
                  <TextArea
                    {...field}
                    aria-label="Query"
                    className="h-full min-h-[5lh] w-full font-mono text-lg"
                    placeholder="e.g. g.V().limit(10)"
                    onKeyDown={onKeyDown}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex gap-6">
            <Button className="w-full" variant="filled" type="submit">
              <CornerDownRightIcon />
              Run query
            </Button>
          </div>
        </form>
      </Form>

      <SearchResultsList
        mutation={mutation}
        retry={() => mutation.mutate(queryText)}
      />
    </div>
  );
}

function SearchResultsList({
  mutation,
  retry,
}: {
  mutation: RawQueryMutationResult;
  retry: () => void;
}) {
  if (mutation.isPending) {
    return (
      <PanelEmptyState
        title="Executing query..."
        icon={<LoadingSpinner />}
        className="p-8"
      />
    );
  }

  if (mutation.isError && !mutation.data) {
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

  return <LoadedResults {...mutation.data} />;
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

  return useMutation({
    mutationFn: async (query: string) => {
      const results = await explorer.rawQuery({ query });

      // Update the schema and the cache
      updateVertexDetailsCache(explorer, queryClient, results.vertices);
      updateEdgeDetailsCache(explorer, queryClient, results.edges);
      await updateSchema(results);

      return results;
    },
  });
}

type RawQueryMutationResult = ReturnType<typeof useRawQueryMutation>;
