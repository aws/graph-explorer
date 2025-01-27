import { GInt64, JanusID } from "../types";

function isJanusID(id: any): id is JanusID {
  return (
    typeof id === "object" &&
    "@type" in id &&
    typeof id["@type"] === "string" &&
    "@value" in id &&
    typeof id["@value"] === "object" &&
    "relationId" in id["@value"] &&
    typeof id["@value"]["relationId"] === "string"
  );
}

export function extractRawId(id: string | GInt64 | JanusID): string | number {
  if (isJanusID(id)) {
    const relationId = id["@value"]["relationId"];
    return relationId;
  }

  if (typeof id === "string") {
    return id;
  }

  const value = id["@value"];
  return value;
}
