import globalMockFetch from "../../testUtils/globalMockFetch";
import mockGremlinFetch from "../../testUtils/mockGremlinFetch";
import fetchSchema from "./fetchSchema";

describe("Gremlin > fetchSchema", () => {
  beforeAll(globalMockFetch);

  it("Should return an inferred schema", async () => {
    const schemaResponse = await fetchSchema(mockGremlinFetch());

    expect(schemaResponse).toMatchObject({
      vertices: [
        {
          type: "continent",
          displayLabel: "Continent",
          total: 7,
          attributes: [
            {
              name: "code",
              displayLabel: "Code",
              dataType: "String",
            },
            {
              name: "type",
              displayLabel: "Type",
              dataType: "String",
            },
            {
              name: "desc",
              displayLabel: "Desc",
              dataType: "String",
            },
          ],
        },
        {
          type: "country",
          displayLabel: "Country",
          total: 237,
          attributes: [
            {
              name: "code",
              displayLabel: "Code",
              dataType: "String",
            },
            {
              name: "type",
              displayLabel: "Type",
              dataType: "String",
            },
            {
              name: "desc",
              displayLabel: "Desc",
              dataType: "String",
            },
          ],
        },
        {
          type: "airport",
          displayLabel: "Airport",
          total: 3503,
          attributes: [
            {
              name: "country",
              displayLabel: "Country",
              dataType: "String",
            },
            {
              name: "longest",
              displayLabel: "Longest",
              dataType: "Number",
            },
            {
              name: "code",
              displayLabel: "Code",
              dataType: "String",
            },
            {
              name: "city",
              displayLabel: "City",
              dataType: "String",
            },
            {
              name: "elev",
              displayLabel: "Elev",
              dataType: "Number",
            },
            {
              name: "icao",
              displayLabel: "Icao",
              dataType: "String",
            },
            {
              name: "lon",
              displayLabel: "Lon",
              dataType: "Number",
            },
            {
              name: "runways",
              displayLabel: "Runways",
              dataType: "Number",
            },
            {
              name: "region",
              displayLabel: "Region",
              dataType: "String",
            },
            {
              name: "type",
              displayLabel: "Type",
              dataType: "String",
            },
            {
              name: "lat",
              displayLabel: "Lat",
              dataType: "Number",
            },
            {
              name: "desc",
              displayLabel: "Desc",
              dataType: "String",
            },
          ],
        },
      ],
      edges: [
        {
          type: "contains",
          displayLabel: "Contains",
          total: 7006,
          attributes: [],
        },
        {
          type: "route",
          displayLabel: "Route",
          total: 50532,
          attributes: [
            {
              name: "dist",
              displayLabel: "Dist",
              dataType: "g:Int32",
            },
          ],
        },
      ],
    });
  });
});
