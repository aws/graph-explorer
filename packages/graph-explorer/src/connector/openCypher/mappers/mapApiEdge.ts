import type { Edge } from "../../../@types/entities";
import type { OCEdge } from "../types";

const mapApiEdge = (apiEdge: OCEdge, sourceType: string, targetType: string): Edge => {
  return {
    data: {
      id: apiEdge["~id"],
      type: apiEdge["~type"],
      source: apiEdge["~start"],
      sourceType: sourceType,
      target: apiEdge["~end"],
      targetType: targetType,
      attributes: apiEdge["~properties"] || {},
    },
  };
};

export default mapApiEdge;
