import { FileButton, PanelHeaderActionButton, Spinner } from "@/components";
import { vertexDetailsQuery, edgeDetailsQuery, Explorer } from "@/connector";
import {
  useExplorer,
  configurationAtom,
  VertexId,
  EdgeId,
  ConnectionWithId,
} from "@/core";
import { logger } from "@/utils";
import { fromFileToJson } from "@/utils/fileData";
import {
  useQueryClient,
  useMutation,
  QueryClient,
} from "@tanstack/react-query";
import { FolderOpenIcon } from "lucide-react";
import { useRecoilValue } from "recoil";
import {
  ExportedGraphConnection,
  exportedGraphSchema,
  isMatchingConnection,
} from "./exportedGraph";
import { useNotification } from "@/components/NotificationProvider";
import { ZodError } from "zod";
import { Notification } from "@/components/NotificationProvider/reducer";
import { getTranslation } from "@/hooks/useTranslations";
import { useAddToGraph } from "@/hooks";

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
  const allConfigs = useRecoilValue(configurationAtom);
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
      const parsed = await exportedGraphSchema.parseAsync(data);

      // 2. Check connection
      if (!isMatchingConnection(explorer.connection, parsed.data.connection)) {
        throw new InvalidConnectionError(
          "Connection must match active connection",
          parsed.data.connection
        );
      }

      // 3. Get the vertex and edge details from the database
      const vertices = new Set(parsed.data.vertices);
      const edges = new Set(parsed.data.edges);
      const entityCountMessage = formatCount(vertices.size, edges.size);

      const progressNotificationId = enqueueNotification({
        title: notificationTitle,
        message: `Loading the graph with ${entityCountMessage} from the file "${file.name}"`,
        type: "loading",
        autoHideDuration: null,
      });

      const result = await fetchEntityDetails(
        vertices,
        edges,
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
      const finalNotification = createCompletionNotification(result);
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

export function createCompletionNotification(
  result: FetchEntityDetailsResult
): Notification {
  if (result.counts.errors.total > 0) {
    const errorMessage = formatCount(
      result.counts.errors.vertices,
      result.counts.errors.edges
    );

    return {
      message: `Finished loading the graph, but ${errorMessage} encountered an error.`,
      type: "error",
    };
  }

  if (result.counts.notFound.total > 0) {
    const errorMessage = formatCount(
      result.counts.notFound.vertices,
      result.counts.notFound.edges
    );
    return {
      message: `Finished loading the graph, but ${errorMessage} were not found.`,
      type: "info",
    };
  }

  const anyImported =
    result.entities.vertices.length + result.entities.edges.length > 0;
  if (!anyImported) {
    return {
      message: `Finished loading the graph, but no nodes or edges were loaded.`,
      type: "error",
    };
  }

  const entityCountMessage = formatCount(
    result.entities.vertices.length,
    result.entities.edges.length
  );
  return {
    message: `Finished loading ${entityCountMessage} from the graph file.`,
    type: "success",
  };
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

async function fetchEntityDetails(
  vertices: Set<VertexId>,
  edges: Set<EdgeId>,
  queryClient: QueryClient,
  explorer: Explorer
) {
  const vertexResults = await Promise.allSettled(
    vertices
      .values()
      .map(id =>
        queryClient.ensureQueryData(
          vertexDetailsQuery({ vertexId: id }, explorer)
        )
      )
  );
  const edgeResults = await Promise.allSettled(
    edges
      .values()
      .map(id =>
        queryClient.ensureQueryData(edgeDetailsQuery({ edgeId: id }, explorer))
      )
  );

  const vertexDetails = vertexResults
    .filter(result => result.status === "fulfilled")
    .map(result => result.value.vertex)
    .filter(v => v != null);
  const edgeDetails = edgeResults
    .filter(result => result.status === "fulfilled")
    .map(result => result.value.edge)
    .filter(e => e != null);

  const countOfVertexErrors = vertexResults.reduce((sum, item) => {
    return sum + (item.status === "rejected" ? 1 : 0);
  }, 0);
  const countOfEdgeErrors = edgeResults.reduce((sum, item) => {
    return sum + (item.status === "rejected" ? 1 : 0);
  }, 0);

  const countOfVertexNotFound = vertexResults.reduce((sum, item) => {
    return (
      sum + (item.status === "fulfilled" && item.value.vertex == null ? 1 : 0)
    );
  }, 0);
  const countOfEdgeNotFound = edgeResults.reduce((sum, item) => {
    return (
      sum + (item.status === "fulfilled" && item.value.edge == null ? 1 : 0)
    );
  }, 0);

  return {
    entities: {
      vertices: vertexDetails,
      edges: edgeDetails,
    },
    counts: {
      notFound: {
        vertices: countOfVertexNotFound,
        edges: countOfEdgeNotFound,
        total: countOfVertexNotFound + countOfEdgeNotFound,
      },
      errors: {
        vertices: countOfVertexErrors,
        edges: countOfEdgeErrors,
        total: countOfVertexErrors + countOfEdgeErrors,
      },
    },
  };
}

export type FetchEntityDetailsResult = Awaited<
  ReturnType<typeof fetchEntityDetails>
>;

function formatCount(vertexCount: number, edgeCount: number) {
  return [formatVertexCount(vertexCount), formatEdgeCount(edgeCount)]
    .filter(message => message != null)
    .join(" and ");
}

function formatVertexCount(count: number) {
  if (count === 0) {
    return null;
  }
  return count > 1
    ? `${count.toLocaleString()} nodes`
    : `${count.toLocaleString()} node`;
}

function formatEdgeCount(count: number) {
  if (count === 0) {
    return null;
  }
  return count > 1
    ? `${count.toLocaleString()} edges`
    : `${count.toLocaleString()} edge`;
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
