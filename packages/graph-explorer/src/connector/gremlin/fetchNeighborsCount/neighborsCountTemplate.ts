import type { NeighborsCountRequest } from "@/connector/useGEFetchTypes";

/**
 * Given a single node ids, it returns a Gremlin template with
 * all neighbors types with their counts.
 *
 * @example
 * ids = "44"
 * limit = 10
 *
 * g.V("44").both().limit(10).dedup()
 *  .group().by(label).by(count())
 */
export default function neighborsCountTemplate({
  vertex,
  limit = 0,
}: NeighborsCountRequest) {
  let template = "";
  if (vertex.idType === "number") {
    template = `g.V(${vertex.id}L).both()`;
  } else {
    template = `g.V("${vertex.id}").both()`;
  }

  if (limit > 0) {
    template += `.limit(${limit})`;
  }
  template += `.dedup().group().by(label).by(count())`;

  return template;
}
