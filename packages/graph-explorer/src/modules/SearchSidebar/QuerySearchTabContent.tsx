import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  Label,
  TextArea,
} from "@/components";
import { rawQueryQuery } from "@/connector";
import { useExplorer, useUpdateSchemaFromEntities } from "@/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerDownRightIcon } from "lucide-react";
import { SearchResultsList } from "./SearchResultsList";
import { useCallback, useDeferredValue } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/utils";
import { atom, useRecoilState } from "recoil";

const formDataSchema = z.object({
  query: z.string().default(""),
});

type FormData = z.infer<typeof formDataSchema>;

export const queryTextAtom = atom({ key: "queryText", default: "" });

export function QuerySearchTabContent() {
  const [queryText, setQueryText] = useRecoilState(queryTextAtom);
  const form = useForm<FormData>({
    resolver: zodResolver(formDataSchema),
    defaultValues: {
      query: queryText,
    },
  });

  const query = useQuerySearch(queryText);

  const executeQuery = useCallback(
    (data: FormData) => {
      logger.debug("Executing query", data);
      if (data.query !== queryText) {
        setQueryText(data.query);
      } else {
        query.refetch();
      }
    },
    [query, queryText, setQueryText]
  );

  return (
    <div className="bg-background-default flex h-full flex-col">
      <Form {...form}>
        <form
          className="border-divider flex shrink-0 flex-col gap-3 border-b p-3"
          onSubmit={form.handleSubmit(executeQuery)}
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
                    className="h-full min-h-[5lh] w-full font-mono"
                    onKeyDown={e => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        form.handleSubmit(executeQuery)();
                      }
                    }}
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

      <SearchResultsList query={query} />
    </div>
  );
}

function useQuerySearch(query: string) {
  const explorer = useExplorer();
  const queryClient = useQueryClient();
  const updateSchema = useUpdateSchemaFromEntities();
  const delayedQuery = useDeferredValue(query);

  return useQuery({
    ...rawQueryQuery(
      { query: delayedQuery },
      updateSchema,
      explorer,
      queryClient
    ),
    staleTime: 0,
  });
}
