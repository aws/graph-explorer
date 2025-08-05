import { Vertex } from "./vertex";
import { Edge } from "./edge";
import { Scalar } from "./scalar";

export type Entity = Vertex | Edge | Scalar;

export type Entities = {
  vertices: Vertex[];
  edges: Edge[];
};
