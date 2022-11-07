import type { Edge } from "../../../@types/entities";
import type { ConfigurationContextProps } from "../../../core";
import { sanitizeText } from "../../../utils";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";
import parseEdgeProperty from "./parseEdgeProperty";

const mapApiEdge = (
  config: ConfigurationContextProps,
  apiEdge: GEdge
): Edge => {
  const et = apiEdge["@value"].label;
  const edgeConfig = config.schema?.edges.find(edge => edge.type === et);

  // Pick name from attributes or use the id
  const nameProperty = edgeConfig?.displayNameAttribute
    ? apiEdge["@value"].properties?.[edgeConfig.displayNameAttribute]
    : null;

  const name = nameProperty
    ? String(parseEdgeProperty(nameProperty))
    : undefined;

  return {
    data: {
      id: apiEdge["@value"].id,
      __e_type: apiEdge["@value"].label,
      __e_type_display: edgeConfig?.displayLabel || apiEdge["@value"].label,
      source: apiEdge["@value"].outV,
      __source: apiEdge["@value"].outV,
      __sourceType: apiEdge["@value"].outVLabel,
      __sourceTypeDisplay: apiEdge["@value"].outVLabel
        .split("::")
        .map(sanitizeText)
        .join(", "),
      target: apiEdge["@value"].inV,
      __target: apiEdge["@value"].inV,
      __targetType: apiEdge["@value"].inVLabel,
      __targetTypeDisplay: apiEdge["@value"].inVLabel
        .split("::")
        .map(sanitizeText)
        .join(", "),
      __directed: true,
      __isHidden: edgeConfig?.hidden,
      __name: name,
      attributes: parseEdgePropertiesValues(apiEdge["@value"].properties || {}),
    },
  };
};

export default mapApiEdge;
