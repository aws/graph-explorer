import {
  createRandomExportedGraphConnection,
  createRandomFile,
  createRandomRawConfiguration,
} from "@/utils/testing";
import {
  createErrorNotification,
  InvalidConnectionError,
} from "./ImportGraphButton";
import { createArray } from "@shared/utils/testing";
import { ZodError } from "zod";

describe("createErrorNotification", () => {
  it("should use generic error for an unrecognized error", () => {
    const error = new Error("test");
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      "Failed to load the graph because an error occurred.",
    );
  });

  it("should use parsing error for a zod error", () => {
    const error = new ZodError([]);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `Parsing the file "${file.name}" failed. Please ensure the file was originally saved from Graph Explorer and is not corrupt.`,
    );
  });

  it("should show the db url and gremlin query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "gremlin";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the graph type PG-Gremlin.`,
    );
  });

  it("should show the db url and sparql query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "sparql";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the graph type RDF-SPARQL.`,
    );
  });

  it("should show the db url and openCypher query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "openCypher";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the graph type PG-openCypher.`,
    );
  });

  it("should show the connection name when a connection using the proxy server is a match", () => {
    const connection = createRandomExportedGraphConnection();
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();
    allConnections[0].graphDbUrl = connection.dbUrl;
    allConnections[0].proxyConnection = true;
    allConnections[0].queryEngine = connection.queryEngine;
    const matchingConnectionName = allConnections[0].displayLabel;

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`,
    );
  });

  it("should show the connection name when a connection not using the proxy server is a match", () => {
    const connection = createRandomExportedGraphConnection();
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();
    allConnections[0].url = connection.dbUrl;
    allConnections[0].proxyConnection = false;
    allConnections[0].queryEngine = connection.queryEngine;
    const matchingConnectionName = allConnections[0].displayLabel;

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`,
    );
  });
});

function createRandomAllConnections() {
  return createArray(3, () => {
    const config = createRandomRawConfiguration();
    return {
      ...config.connection!,
      id: config.id,
      displayLabel: config.displayLabel,
    };
  });
}
