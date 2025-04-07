import { createVertexId } from "@/core";
import neighborsCountTemplate from "./neighborsCountTemplate";
import { normalizeWithNewlines as normalize } from "@/utils/testing";
import { query } from "@/utils";

describe("neighborsCountTemplate", () => {
  it("should return a valid query", () => {
    const template = neighborsCountTemplate({
      resourceURI: createVertexId(
        "http://kelvinlawrence.net/air-routes/resource/2018"
      ),
      limit: 10,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT ?class (COUNT(?neighbor) as ?count) {
          SELECT DISTINCT ?class ?neighbor
          WHERE {
            BIND(<http://kelvinlawrence.net/air-routes/resource/2018> AS ?source)
            {
              # Incoming neighbors
              ?neighbor ?pIncoming ?source . 
            }
            UNION
            { 
              # Outgoing neighbors
              ?source ?pOutgoing ?neighbor . 
            }
            ?neighbor a ?class .
            FILTER NOT EXISTS {
              ?anySubject a ?neighbor .
            }
          }
          LIMIT 10
        }
        GROUP BY ?class
      `)
    );
  });
});
