import { DisplayAttribute } from "./displayAttribute";
import { DisplayConfigAttribute } from "./displayTypeConfigs";

/** The RDFS label property name that should be sorted first in attribute lists */
export const RDFS_LABEL_URI = "http://www.w3.org/2000/01/rdf-schema#label";

/**
 * Sorts the given attributes by `displayLabel` alphabetically, with any
 * `rdfs:label` attributes moved to the first position.
 */
export function sortAttributeByName(
  a: DisplayConfigAttribute | DisplayAttribute,
  b: DisplayConfigAttribute | DisplayAttribute
) {
  // rdfs:label should always be first
  if (a.name === RDFS_LABEL_URI) return -1;
  if (b.name === RDFS_LABEL_URI) return 1;
  return a.displayLabel.localeCompare(b.displayLabel);
}
