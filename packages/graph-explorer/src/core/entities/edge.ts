import { Branded } from "@/utils";
import { Vertex } from "./vertex";
import { EntityProperties, EntityRawId } from "./shared";

export type EdgeId = Branded<EntityRawId, "EdgeId">;

export type Edge = {
  /**
   * Indicates the type in order to discriminate from the `Vertex` type in unions.
   */
  entityType: "edge";

  /**
   * Unique identifier for the edge.
   * - For PG, the edge id
   * - For RDF, predicates do not have ids like PG graphs.
   *   So, a synthetic id is created using <source URI>-[predicate]-><target URI>
   */
  id: EdgeId;

  /**
   * Edge type.
   * - For PG, the label which identifies the relation type
   * - For RDF, the predicate
   */
  type: string;

  /**
   * The source vertex from which this edge originates.
   */
  source: Vertex;

  /**
   * The target vertex to which this edge points.
   */
  target: Vertex;

  /**
   * Only for PG, attributes associated to the edge.
   * For RDF, predicates do not have more properties than the predicate itself.
   */
  attributes: EntityProperties;

  /**
   * Sometimes the edge response does not include the properties, so this flag
   * indicates that another query must be executed to get the properties.
   */
  __isFragment: boolean;
};
