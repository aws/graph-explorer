import type { Vertex } from "./vertex";
import type { Edge } from "./edge";

/**
 * An object containing both vertices and edges.
 *
 * This represents the core graph data structure used throughout the application
 * for storing and manipulating graph data.
 */
export type Entities = {
  /** Array of fully materialized vertices */
  vertices: Vertex[];
  /** Array of fully materialized edges */
  edges: Edge[];
};
