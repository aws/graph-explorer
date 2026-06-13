/**
 * A realistic exported connection file, mirroring the structure produced by
 * `saveConfigurationToFile` across many released versions of Graph Explorer.
 *
 * The shape intentionally matches a real-world export: a top-level
 * `{ id, displayLabel, connection, schema }` envelope where the full schema
 * (styled vertex/edge type configs, ISO `lastUpdate`, `edgeConnections`) is
 * embedded alongside the connection. On import this envelope is split — the
 * connection lands in `configurationAtom` and the schema in `schemaAtom`.
 *
 * The data here is synthetic (a fictional "Movies" graph against example.com
 * endpoints) so it carries no private connection details, but the structure is
 * faithful to genuine exports so it can pin backward-compatible import behavior.
 */
export const legacyExportedConnectionFile = {
  id: "00000000-0000-4000-8000-000000000001",
  displayLabel: "Movies - Gremlin Server",
  connection: {
    url: "http://localhost:5173",
    queryEngine: "gremlin",
    proxyConnection: true,
    graphDbUrl:
      "https://movies.cluster-example.us-west-2.neptune.amazonaws.com:8182",
    awsAuthEnabled: true,
    serviceType: "neptune-db",
    awsRegion: "us-west-2",
  },
  schema: {
    vertices: [
      {
        attributes: [
          { name: "title", dataType: "String" },
          { name: "year", dataType: "Number" },
          { name: "runtime", dataType: "Number" },
          { name: "genre", dataType: "String" },
        ],
        displayNameAttribute: "title",
        longDisplayNameAttribute: "genre",
        iconUrl: "lucide:clapperboard",
        iconImageType: "image/svg+xml",
        color: "#5947e6",
        shape: "ellipse",
        backgroundOpacity: 0.4,
        borderWidth: 0,
        borderColor: "#128EE5",
        borderStyle: "solid",
        type: "movie",
      },
      {
        attributes: [
          { name: "name", dataType: "String" },
          { name: "born", dataType: "Number" },
        ],
        displayNameAttribute: "name",
        longDisplayNameAttribute: "types",
        // A base64-encoded SVG data URI, exactly as older exports stored custom icons.
        iconUrl:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjwvc3ZnPg==",
        iconImageType: "image/svg+xml",
        color: "#128EE5",
        shape: "ellipse",
        backgroundOpacity: 0.4,
        borderWidth: 0,
        borderColor: "#128EE5",
        borderStyle: "solid",
        type: "person",
      },
    ],
    edges: [
      {
        attributes: [{ name: "role", dataType: "String" }],
        displayNameAttribute: "types",
        labelColor: "#17457b",
        labelBackgroundOpacity: 0.7,
        labelBorderColor: "#17457b",
        labelBorderStyle: "solid",
        labelBorderWidth: 0,
        lineColor: "#b3b3b3",
        lineThickness: 2,
        lineStyle: "solid",
        sourceArrowStyle: "none",
        targetArrowStyle: "triangle",
        type: "actedIn",
      },
      {
        attributes: [],
        displayNameAttribute: "types",
        labelColor: "#17457b",
        labelBackgroundOpacity: 0.7,
        labelBorderColor: "#17457b",
        labelBorderStyle: "solid",
        labelBorderWidth: 0,
        lineColor: "#b3b3b3",
        lineThickness: 2,
        lineStyle: "solid",
        sourceArrowStyle: "none",
        targetArrowStyle: "triangle",
        type: "directed",
      },
    ],
    lastUpdate: "2026-06-10T22:14:17.810Z",
    edgeConnections: [
      {
        sourceVertexType: "person",
        edgeType: "actedIn",
        targetVertexType: "movie",
      },
      {
        sourceVertexType: "person",
        edgeType: "directed",
        targetVertexType: "movie",
        count: 12,
      },
    ],
  },
} as const;
