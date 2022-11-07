import { Edge } from "../../../@types/entities";
import { ConfigurationContextProps } from "../../../core";
import { sanitizeText } from "../../../utils";
import { NeighborsRequest, NeighborsResponse } from "../../AbstractConnector";
import mapRawResultToVertex from "../mappers/mapRawResultToVertex";
import incomingOneHopTemplate from "../templates/incomingOneHopTemplate";
import outgoingOneHopTemplate from "../templates/outgoingOneHopTemplate";
import { RawResult, RawValue, SparqlFetch } from "../types";
import fetchNeighborsCount from "./fetchNeighborsCount";

// TODO - rename bindings
type RawOutgoingNeighbors = {
  head: {
    vars: [
      "start",
      "startVertexType",
      "target",
      "property",
      "propertyValue",
      "edge",
      "vertexType"
    ];
  };
  results: {
    bindings: Array<{
      start: RawValue;
      startVertexType: RawValue;
      target: RawValue;
      property: RawValue;
      propertyValue: RawValue;
      edge: RawValue;
      vertexType: RawValue;
    }>;
  };
};

type RawIncomingNeighbors = {
  head: {
    vars: [
      "start",
      "property",
      "propertyValue",
      "edge",
      "vertexType",
      "target",
      "targetVertexType"
    ];
  };
  results: {
    bindings: Array<{
      start: RawValue;
      target: RawValue;
      targetVertexType: RawValue;
      property: RawValue;
      propertyValue: RawValue;
      edge: RawValue;
      vertexType: RawValue;
    }>;
  };
};

const mapOutgoingToEdge = (
  result: RawOutgoingNeighbors["results"]["bindings"][number]
): Edge => {
  return {
    data: {
      id: `${result.start.value}-[${result.edge.value}]->${result.target.value}`,
      source: result.start.value,
      __source: result.start.value,
      target: result.target.value,
      __target: result.target.value,
      __e_type: result.edge.value,
      __e_type_display: sanitizeText(result.edge.value),
      __isHidden: false,
      __sourceType: result.startVertexType.value,
      __sourceTypeDisplay: sanitizeText(result.startVertexType.value),
      __targetType: result.vertexType.value,
      __targetTypeDisplay: sanitizeText(result.vertexType.value),
      attributes: {},
      __directed: true,
    },
  };
};

const mapIncomingToEdge = (
  result: RawIncomingNeighbors["results"]["bindings"][number]
): Edge => {
  return {
    data: {
      id: `${result.start.value}-[${result.edge.value}]->${result.target.value}`,
      source: result.start.value,
      __source: result.start.value,
      target: result.target.value,
      __target: result.target.value,
      __e_type: result.edge.value,
      __e_type_display: sanitizeText(result.edge.value),
      __isHidden: false,
      __sourceType: result.vertexType.value,
      __sourceTypeDisplay: result.vertexType.value,
      __targetType: result.targetVertexType.value,
      __targetTypeDisplay: sanitizeText(result.targetVertexType.value),
      attributes: {},
      __directed: true,
    },
  };
};

const fetchOutgoingNeighbors = async (
  config: ConfigurationContextProps,
  sparqlFetch: SparqlFetch,
  req: NeighborsRequest
): Promise<NeighborsResponse> => {
  const template = outgoingOneHopTemplate(req);
  const data = await sparqlFetch<RawOutgoingNeighbors>(template);

  const mappedResults: Record<string, RawResult> = {};
  const edges: Edge[] = [];
  data.results.bindings.forEach(result => {
    if (!mappedResults[result.target.value]) {
      mappedResults[result.target.value] = {
        __v_id: result.target.value,
        __v_type: result.vertexType.value,
        attributes: {},
      };

      edges.push(mapOutgoingToEdge(result));
    }

    if (result.propertyValue.type === "literal") {
      mappedResults[result.target.value].attributes[
        result.property.value
      ] = sanitizeText(result.propertyValue.value);
    }
  });

  const vertices = await Promise.all(
    Object.values(mappedResults).map(async result => {
      const counts = await fetchNeighborsCount(sparqlFetch, {
        vertexId: result.__v_id,
        limit: 0,
      });

      return mapRawResultToVertex(config, result, counts);
    })
  );

  return {
    vertices,
    edges,
  };
};

const fetchIncomingNeighbors = async (
  config: ConfigurationContextProps,
  sparqlFetch: SparqlFetch,
  req: NeighborsRequest
): Promise<NeighborsResponse> => {
  const template = incomingOneHopTemplate(req);
  const data = await sparqlFetch<RawIncomingNeighbors>(template);

  const mappedResults: Record<string, RawResult> = {};
  const edges: Edge[] = [];
  data.results.bindings.forEach(result => {
    if (!mappedResults[result.start.value]) {
      mappedResults[result.start.value] = {
        __v_id: result.start.value,
        __v_type: result.vertexType.value,
        attributes: {},
      };

      edges.push(mapIncomingToEdge(result));
    }

    if (result.propertyValue.type === "literal") {
      mappedResults[result.start.value].attributes[result.property.value] =
        result.propertyValue.value;
    }
  });

  const vertices = await Promise.all(
    Object.values(mappedResults).map(async result => {
      const counts = await fetchNeighborsCount(sparqlFetch, {
        vertexId: result.__v_id,
        limit: 0,
      });

      return mapRawResultToVertex(config, result, counts);
    })
  );

  return {
    vertices,
    edges,
  };
};

const fetchNeighbors = async (
  config: ConfigurationContextProps,
  sparqlFetch: SparqlFetch,
  req: NeighborsRequest
): Promise<NeighborsResponse> => {
  const outgoing = await fetchOutgoingNeighbors(config, sparqlFetch, req);
  const incoming = await fetchIncomingNeighbors(config, sparqlFetch, req);

  const mergedVertices = [...outgoing.vertices, ...incoming.vertices];
  const mergedEdges = [...outgoing.edges, ...incoming.edges];

  return {
    vertices: mergedVertices,
    edges: mergedEdges,
  };
};

export default fetchNeighbors;
