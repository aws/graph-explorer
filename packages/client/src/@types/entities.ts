export interface ElementData extends Record<string, unknown> {
  /**
   * Unique id.  Synthetic.  Do not try to pass to server
   */
  id: string;
}

export interface VertexData extends ElementData {
  /**
   * Unique id for vertex, only unique for vertex type.  Use this when talking to server
   */
  __v_id: string;
  /**
   * Primary vertex type.
   */
  __v_type: string;
  /**
   * All vertex types.
   */
  __v_types: string[];
  /**
   * Vertex type formatted for displaying to the user.
   */
  __v_type_display: string;
  /**
   * The URL to the SVG to render for this vertex
   */
  __iconUrl?: string;
  /**
   * Formatted name of this vertex for showing to user
   */
  __name?: string;
  /**
   * Formatted long name of this vertex for showing to outside the graph like in search
   */
  __longName?: string;
  /**
   * The number of server-side neighbors of this vertex
   */
  __totalNeighborCount: number;
  /**
   * The number of server-side neighbors of this vertex, grouped by vertex type
   */
  __totalNeighborCounts: Record<string, number>;
  /**
   * Flag to determine whether to show vertex in UI
   */
  __isHidden?: boolean;
  __isGroupNode?: boolean;
  __unfetchedNeighborCount: number;
  __unfetchedNeighborCounts: Record<string, number>;
  __fetchedInEdgeCount: number;
  __fetchedOutEdgeCount: number;
  __fetchedUndirectedEdgeCount: number;
  attributes: Record<string, string | number>;
}

export interface Vertex<T = Record<string, unknown>> {
  data: VertexData & T;
}

export interface EdgeData extends ElementData {
  /**
   * synthetic id of the node this edge is coming out of (the outbound node)
   */
  source: string;
  /**
   * synthetic id of the node this edge is pointing into (the inbound node)
   */
  target: string;
  /**
   * edge type.  suitable for logic.  do not show to user
   */
  __e_type: string;
  /**
   * edge type formatted for display to user
   */
  __e_type_display: string;
  /**
   * Formatted name of this edge for display to user
   */
  __name?: string;
  /**
   * The tigergraph vertex id of the source
   */
  __source: string;
  __sourceType: string;
  __sourceTypeDisplay: string;
  /**
   * The tigergraph vertex id of the target
   */
  __target: string;
  __targetType: string;
  __targetTypeDisplay: string;
  /**
   * if false then this is an undirected edge (no arrow...and nodes are neither inbound nore outbound)
   */
  __directed: boolean;
  /**
   * Flag to determine whether to show Edge in UI
   */
  __isHidden?: boolean;
  attributes: Record<string, string | number>;
}

export interface Edge<T = Record<string, unknown>> {
  data: EdgeData & T;
}
