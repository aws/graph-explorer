import { createVertexId } from "@/core";
import neighborsCountTemplate from "./neighborsCountTemplate";
import { normalizeWithNewlines as normalize } from "@/utils/testing";
import { query } from "@/utils";

describe("neighborsCountTemplate", () => {
  it("should return query with no limit", () => {
    const template = neighborsCountTemplate({
      resourceURI: createVertexId(
        "http://kelvinlawrence.net/air-routes/resource/2018"
      ),
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT ?class (COUNT(?neighbor) as ?count) {
          SELECT DISTINCT ?class ?neighbor
          WHERE {
            BIND(<http://kelvinlawrence.net/air-routes/resource/2018> AS ?source)
            {
              ?neighbor ?pIncoming ?source . 
            }
            UNION
            {
              ?source ?pOutgoing ?neighbor . 
            }
            ?neighbor a ?class .
            FILTER NOT EXISTS {
              ?anySubject a ?neighbor .
            }
          }
        }
        GROUP BY ?class
      `)
    );
  });
});
