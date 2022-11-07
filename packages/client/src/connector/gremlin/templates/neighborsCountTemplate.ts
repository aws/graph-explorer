import type { NeighborsCountRequest } from "../../AbstractConnector";

const neighborsCountTemplate = ({
  vertexId,
  limit = 500,
}: NeighborsCountRequest) => {
  let template = `g.V("${vertexId}").both()`;

  if (limit > 0) {
    template += `.limit(${limit})`;
  }
  template += `.dedup().group().by(label()).by(count())`;

  return template;
};

export default neighborsCountTemplate;
