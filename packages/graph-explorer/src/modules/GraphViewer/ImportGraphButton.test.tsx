// @vitest-environment happy-dom
import type { LegacyConnectionConfig } from "@shared/types";

import { createArray } from "@shared/utils/testing";
import { ZodError } from "zod";

import type { RawConfiguration } from "@/core";

import { transformConfiguration } from "@/core/StateProvider/configurationTransform";
import {
  createRandomExportedGraphConnection,
  createRandomFile,
  createRandomRawConfiguration,
} from "@/utils/testing";

import {
  createErrorNotification,
  InvalidConnectionError,
} from "./ImportGraphButton";

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
      `The graph file requires a connection to ${connection.dbUrl} using the query language PG-Gremlin.`,
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
      `The graph file requires a connection to ${connection.dbUrl} using the query language RDF-SPARQL.`,
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
      `The graph file requires a connection to ${connection.dbUrl} using the query language PG-openCypher.`,
    );
  });

  it("should show the connection name when a connection is a match", () => {
    const connection = createRandomExportedGraphConnection();
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();
    allConnections[0].graphDbUrl = connection.dbUrl;
    allConnections[0].queryEngine = connection.queryEngine;
    const matchingConnectionName = allConnections[0].displayLabel;

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`,
    );
  });

  // Regression: `configurationAtom`'s read-time transform migrates a legacy
  // `url`/`proxyConnection` connection to `graphDbUrl` before
  // `useImportGraphMutation` reads it, so matching against a pre-upgrade
  // connection still finds it instead of reporting no match.
  it("should show the connection name when a match is found via a legacy stored connection", () => {
    const legacyConfig: RawConfiguration = {
      ...createRandomRawConfiguration(),
      // Stored data is not schema-validated on read, so an entry can carry a
      // legacy connection despite the compile-time `ConnectionConfig` shape.
      connection: {
        url: "https://my-neptune:8182",
        proxyConnection: false,
      } as LegacyConnectionConfig as RawConfiguration["connection"],
    };
    const [migratedConfig] = transformConfiguration(
      new Map([[legacyConfig.id, legacyConfig]]),
    ).values();

    const allConnections = createRandomAllConnections();
    allConnections[0] = {
      ...migratedConfig.connection!,
      id: migratedConfig.id,
      displayLabel: migratedConfig.displayLabel,
    };

    const connection = createRandomExportedGraphConnection();
    connection.dbUrl = "https://my-neptune:8182";
    // The legacy connection carries no queryEngine, so matching falls back to
    // "gremlin" (see `createExportedConnection`).
    connection.queryEngine = "gremlin";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${allConnections[0].displayLabel}.`,
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
