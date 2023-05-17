import { GInt64, JanusID } from "../types";

const isJanusID = (id: any): id is JanusID => {
  return (
    typeof id === "object" &&
    "@type" in id &&
    typeof id["@type"] === "string" &&
    "@value" in id &&
    typeof id["@value"] === "object" &&
    "relationId" in id["@value"] &&
    typeof id["@value"]["relationId"] === "string"
  );
};

const toStringId = (id: string | GInt64 | JanusID): string => {
  if (typeof id === "string") {
    return id;
  }

  if (isJanusID(id)) {
    return id["@value"]["relationId"];
  }

  return String(id["@value"]);
};

export default toStringId;