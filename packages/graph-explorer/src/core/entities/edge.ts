import { Branded } from "@/utils";
import { VertexId } from "./vertex";
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
   * Source vertex id
   */
  source: VertexId;
  /**
   * Target vertex id
   */
  target: VertexId;
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
