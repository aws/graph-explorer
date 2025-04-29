import { atom } from "jotai";
import { edgesTypesFilteredAtom } from "./edges";
import { nodesTypesFilteredAtom } from "./nodes";

/**
 * The count of filtered node and edge types
 */
export const totalFilteredCount = atom(get => {
  // Get all the filtered entities
  const filteredNodeTypes = get(nodesTypesFilteredAtom);
  const filteredEdgeTypes = get(edgesTypesFilteredAtom);

  // Determine how many entity types are not checked
  return filteredNodeTypes.size + filteredEdgeTypes.size;
});
