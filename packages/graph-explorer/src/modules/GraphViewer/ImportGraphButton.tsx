import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { FolderOpenIcon } from "lucide-react";
import { toast } from "sonner";
import { ZodError } from "zod";

import { FileButton, PanelHeaderActionButton, Spinner } from "@/components";
import { fetchEntityDetails, notifyOnIncompleteRestoration } from "@/connector";
import { configurationAtom, type ConnectionWithId, useExplorer } from "@/core";
import { useAddToGraph } from "@/hooks";
import { getTranslation } from "@/hooks/useTranslations";
import { formatEntityCounts, logger } from "@/utils";
import { fromFileToJson } from "@/utils/fileData";

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
      <PanelHeaderActionButton
        icon={importGraph.isPending ? <Spinner /> : <FolderOpenIcon />}
        label="Load graph from file"
        disabled={importGraph.isPending}
      />
    </FileButton>
  );
}

function useImportGraphMutation() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();
  const addToGraph = useAddToGraph();
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

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Parse the file
      const data = await fromFileToJson(file);
      const graph = await parseExportedGraph(data);

      // 2. Check connection
      if (!isMatchingConnection(explorer.connection, graph.connection)) {
        throw new InvalidConnectionError(
          "Connection must match active connection",
          graph.connection,
        );
      }

      // 3. Get the vertex and edge details from the database
      const entityCountMessage = formatEntityCounts(
        graph.vertices.size,
        graph.edges.size,
      );

      const loadPromise = (async () => {
        const result = await fetchEntityDetails(
          graph.vertices,
          graph.edges,
          queryClient,
        );

        // 4. Update Graph Explorer state
        await addToGraph(result.entities);

        return result;
      })();

      toast.promise(loadPromise, {
        loading: `Loading ${entityCountMessage}`,
        error: "Failed to load the graph",
      });
      const result = await loadPromise;
      notifyOnIncompleteRestoration(result);

      return result;
    },
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
  if (error instanceof ZodError) {
    return `Parsing the file "${file.name}" failed. Please ensure the file was originally saved from Graph Explorer and is not corrupt.`;
  } else if (error instanceof InvalidConnectionError) {
    const matchingByUrlAndQueryEngine = allConnections.filter(connection =>
      isMatchingConnection(connection, error.connection),
    );

    const displayQueryEngine = getTranslation(
      "graph-type",
      error.connection.queryEngine,
    );

    if (matchingByUrlAndQueryEngine.length > 0) {
      const matchingConnection = matchingByUrlAndQueryEngine[0];
      return `The graph file requires switching to connection ${matchingConnection.displayLabel}.`;
    } else {
      const dbUrl = error.connection.dbUrl;
      return `The graph file requires a connection to ${dbUrl} using the graph type ${displayQueryEngine}.`;
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
