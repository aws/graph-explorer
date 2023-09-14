/*This returns the types and attributes of all the connected edges */
import type { Criterion, NeighborsRequest } from "../../AbstractConnector";


const edgesConnected = ({
    vertexId,   
    idType = "string",
}: Omit<NeighborsRequest, "vertexType">& {
    idType?: "string" | "number";
  }): string => {
    let template = "";
    if (idType === "number") {
      template = `g.V(${vertexId}L)`;
    } else {
      template = `g.V("${vertexId}")`;
    }

    template += `bothE().project("vertices", "edges".bothV()).by()`;
    return template;

};

export default edgesConnected;