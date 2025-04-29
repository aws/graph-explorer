import { FileButton, PanelHeaderActionButton, Spinner } from "@/components";
import {
  useExplorer,
  configurationAtom,
  ConnectionWithId,
  fetchEntityDetails,
  createFetchEntityDetailsCompletionNotification,
} from "@/core";
import { logger, formatEntityCounts } from "@/utils";
import { fromFileToJson } from "@/utils/fileData";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { FolderOpenIcon } from "lucide-react";
import {
  ExportedGraphConnection,
  isMatchingConnection,
  parseExportedGraph,
} from "./exportedGraph";
import { useNotification } from "@/components/NotificationProvider";
import { ZodError } from "zod";
import { Notification } from "@/components/NotificationProvider/reducer";
import { getTranslation } from "@/hooks/useTranslations";
import { useAddToGraph } from "@/hooks";
import { useAtomValue } from "jotai";

export function ImportGraphButton() {
  const importGraph = useImportGraphMutation();

  return (
    <FileButton
      onChange={payload => payload && importGraph.mutate(payload[0])}
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
        : null
    )
    .filter(c => c != null)
    .toArray();

  const { enqueueNotification, clearNotification } = useNotification();

  const notificationTitle = "Loading Graph";

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Parse the file
      const data = await fromFileToJson(file);
      const graph = await parseExportedGraph(data);

      // 2. Check connection
      if (!isMatchingConnection(explorer.connection, graph.connection)) {
        throw new InvalidConnectionError(
          "Connection must match active connection",
          graph.connection
        );
      }

      // 3. Get the vertex and edge details from the database
      const entityCountMessage = formatEntityCounts(
        graph.vertices.size,
        graph.edges.size
      );

      const progressNotificationId = enqueueNotification({
        title: notificationTitle,
        message: `Loading the graph with ${entityCountMessage} from the file "${file.name}"`,
        type: "loading",
        autoHideDuration: null,
      });

      const result = await fetchEntityDetails(
        graph.vertices,
        graph.edges,
        queryClient,
        explorer
      );

      clearNotification(progressNotificationId);

      return result;
    },
    onSuccess: result => {
      // 4. Update Graph Explorer state
      addToGraph(result.entities);

      // 5. Notify user of completion
      const finalNotification =
        createFetchEntityDetailsCompletionNotification(result);
      enqueueNotification({
        ...finalNotification,
        title: notificationTitle,
      });
    },
    onError: (error, file) => {
      const notification = createErrorNotification(error, file, allConnections);
      enqueueNotification({
        ...notification,
        title: notificationTitle,
      });
    },
  });
  return mutation;
}

export function createErrorNotification(
  error: Error,
  file: File,
  allConnections: ConnectionWithId[]
): Notification {
  if (error instanceof ZodError) {
    // Parsing has failed
    logger.error(`Failed to parse the file "${file.name}"`, error.format());
    return {
      message: `Parsing the file "${file.name}" failed. Please ensure the file was originally saved from Graph Explorer and is not corrupt.`,
      type: "error",
    };
  } else if (error instanceof InvalidConnectionError) {
    // Invalid connection
    const matchingByUrlAndQueryEngine = allConnections.filter(connection =>
      isMatchingConnection(connection, error.connection)
    );

    // Get the display label for the given query engine
    const displayQueryEngine = getTranslation(
      "available-connections.graph-type",
      error.connection.queryEngine
    );

    if (matchingByUrlAndQueryEngine.length > 0) {
      const matchingConnection = matchingByUrlAndQueryEngine[0];
      return {
        message: `The graph file requires switching to connection ${matchingConnection.displayLabel}.`,
        type: "error",
      };
    } else {
      const dbUrl = error.connection.dbUrl;
      return {
        message: `The graph file requires a connection to ${dbUrl} using the graph type ${displayQueryEngine}.`,
        type: "error",
      };
    }
  }
  return {
    message: `Failed to load the graph because an error occurred.`,
    type: "error",
  };
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
