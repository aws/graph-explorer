import { globalMockFetch } from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import fetchSchema from ".";
import { ClientLoggerConnector } from "@/connector/LoggerConnector";

describe("Gremlin > fetchSchema", () => {
  it("Should return an inferred schema", async () => {
    globalMockFetch(
      "vertices-labels-and-counts.json",
      "vertices-schema.json",
      "edges-labels-and-counts.json",
      "edges-schema.json"
    );
    const schemaResponse = await fetchSchema(
      mockGremlinFetch(),
      new ClientLoggerConnector()
    );

    expect(schemaResponse).toMatchObject({
      vertices: [
        {
          type: "continent",
          total: 7,
          attributes: [
            {
              name: "code",
              dataType: "String",
            },
            {
              name: "type",
              dataType: "String",
            },
            {
              name: "desc",
              dataType: "String",
            },
          ],
        },
        {
          type: "country",
          total: 237,
          attributes: [
            {
              name: "code",
              dataType: "String",
            },
            {
              name: "type",
              dataType: "String",
            },
            {
              name: "desc",
              dataType: "String",
            },
          ],
        },
        {
          type: "airport",
          total: 3503,
          attributes: [
            {
              name: "country",
              dataType: "String",
            },
            {
              name: "longest",
              dataType: "Number",
            },
            {
              name: "code",
              dataType: "String",
            },
            {
              name: "city",
              dataType: "String",
            },
            {
              name: "elev",
              dataType: "Number",
            },
            {
              name: "icao",
              dataType: "String",
            },
            {
              name: "lon",
              dataType: "Number",
            },
            {
              name: "runways",
              dataType: "Number",
            },
            {
              name: "region",
              dataType: "String",
            },
            {
              name: "type",
              dataType: "String",
            },
            {
              name: "lat",
              dataType: "Number",
            },
            {
              name: "desc",
              dataType: "String",
            },
          ],
        },
      ],
      edges: [
        {
          type: "contains",
          total: 7006,
          attributes: [],
        },
        {
          type: "route",
          total: 50532,
          attributes: [
            {
              name: "dist",
              dataType: "Number",
            },
          ],
        },
      ],
    });
  });
});
