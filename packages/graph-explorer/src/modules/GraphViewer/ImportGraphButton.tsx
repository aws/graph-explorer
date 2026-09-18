import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { FolderOpenIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";

import { Button, FileButton, Spinner } from "@/components";
import { fetchEntityDetails, notifyOnIncompleteRestoration } from "@/connector";
import {
  configurationAtom,
  type ConnectionWithId,
  useConfiguration,
  useExplorer,
  usePopulateGraph,
} from "@/core";
import { FileEnvelopeError } from "@/core/fileEnvelope";
import {
  commitGraphRestoration,
  graphRestorationRequestAtom,
  isCurrentGraphRestoration,
  startGraphRestoration,
} from "@/core/StateProvider/graphSession/restoration";
import { resolveGraphSessionLayout } from "@/core/StateProvider/graphSession/storage";
import { useEntityCountFormatterCallback } from "@/hooks/useEntityCountFormatter";
import { getTranslation } from "@/hooks/useTranslations";
import { logger } from "@/utils";

import {
  type ExportedGraphConnection,
  isMatchingConnection,
  parseExportedGraph,
} from "./exportedGraph";

export function ImportGraphButton() {
  const importGraph = useImportGraphMutation();

  return (
    <FileButton
      onChange={payload => payload && importGraph.mutate(payload)}
      accept="application/json"
      asChild
    >
      <Button
        tooltip="Load graph from file"
        variant="ghost"
        size="icon"
        disabled={importGraph.isPending}
      >
        {importGraph.isPending ? <Spinner /> : <FolderOpenIcon />}
      </Button>
    </FileButton>
  );
}

export function useImportGraphMutation() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();
  const config = useConfiguration();
  const populateGraph = usePopulateGraph();
  const formatEntityCounts = useEntityCountFormatterCallback();
  const allConfigs = useAtomValue(configurationAtom);
  const allConnections = allConfigs
    .values()
    .map(config =>
      config.connection
        ? {
            ...config.connection,
            id: config.id,
            displayLabel: config.displayLabel,
          }
        : null,
    )
    .filter(c => c != null)
    .toArray();

  const mutationFn = useAtomCallback(
    useCallback(
      async (get, set, file: File) => {
        const target = config?.id;

        if (!target) {
          throw new Error("No active connection to import the graph");
        }

        const graph = await parseExportedGraph(file);

        if (!isMatchingConnection(explorer.connection, graph.connection)) {
          throw new InvalidConnectionError(
            "Connection must match active connection",
            graph.connection,
          );
        }

        const token = startGraphRestoration(set, target);

        const entityCountMessage = formatEntityCounts(
          graph.vertices.size,
          graph.edges.size,
        );

        let committed = false;

        const loadPromise = (async () => {
          const result = await fetchEntityDetails(
            graph.vertices,
            graph.edges,
            queryClient,
          );

          if (!isCurrentGraphRestoration(get, token, target)) {
            return result;
          }

          populateGraph(result.entities);

          if (!isCurrentGraphRestoration(get, token, target)) {
            return result;
          }

          committed = commitGraphRestoration(get, set, {
            token,
            target,
            layout: resolveGraphSessionLayout(graph.layout),
            arrangement: graph.arrangement,
          });

          return result;
        })();

        toast.promise(loadPromise, {
          loading: `Loading ${entityCountMessage}`,
          error: "Failed to load the graph",
        });

        try {
          const result = await loadPromise;

          if (committed) {
            notifyOnIncompleteRestoration(result);
          }

          return result;
        } finally {
          if (isCurrentGraphRestoration(get, token, target)) {
            set(graphRestorationRequestAtom, null);
          }
        }
      },
      [queryClient, explorer, config, populateGraph, formatEntityCounts],
    ),
  );

  const mutation = useMutation({
    mutationFn,
    onError: (error, file) => {
      const notification = createErrorNotification(error, file, allConnections);
      logger.error(`Loading graph failed: ${notification}`, error);
      toast.error("Loading Graph Failed", {
        description: notification,
      });
    },
  });
  return mutation;
}

export function createErrorNotification(
  error: Error,
  file: File,
  allConnections: ConnectionWithId[],
) {
  if (error instanceof FileEnvelopeError) {
    return error.message;
  } else if (error instanceof ZodError) {
    return `Parsing the file "${file.name}" failed. Please ensure the file was originally saved from Graph Explorer and is not corrupt.`;
  } else if (error instanceof InvalidConnectionError) {
    const matchingByUrlAndQueryEngine = allConnections.filter(connection =>
      isMatchingConnection(connection, error.connection),
    );

    const displayQueryEngine = getTranslation(
      "query-language",
      error.connection.queryEngine,
    );

    if (matchingByUrlAndQueryEngine.length > 0) {
      const matchingConnection = matchingByUrlAndQueryEngine[0];
      return `The graph file requires switching to connection ${matchingConnection.displayLabel}.`;
    } else {
      const dbUrl = error.connection.dbUrl;
      return `The graph file requires a connection to ${dbUrl} using the query language ${displayQueryEngine}.`;
    }
  }
  return "Failed to load the graph because an error occurred.";
}

export class InvalidConnectionError extends Error {
  connection: ExportedGraphConnection;
  constructor(message: string, connection: ExportedGraphConnection) {
    super(message);
    this.name = "InvalidConnectionError";
    this.connection = connection;
    Object.setPrototypeOf(this, InvalidConnectionError.prototype);
  }
}
