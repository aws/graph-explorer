import { Vertex, VertexId } from "./vertex";
import { Edge, EdgeId } from "./edge";
import { Scalar } from "./scalar";

export type Entity = Vertex | Edge | Scalar;

export type Entities = {
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
};
