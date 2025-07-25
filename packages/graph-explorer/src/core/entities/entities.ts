import { Vertex, VertexId } from "./vertex";
import { Edge, EdgeId } from "./edge";

export type Entities = {
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
};
