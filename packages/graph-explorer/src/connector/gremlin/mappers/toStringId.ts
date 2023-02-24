import { GInt64 } from "../types";

const toStringId = (id: string | GInt64): string => {
  if (typeof id === "string") {
    return id;
  }

  return String(id["@value"]);
};

export default toStringId;
