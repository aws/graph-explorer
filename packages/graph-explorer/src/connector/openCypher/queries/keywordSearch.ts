import { Vertex } from "../../../@types/entities";
import type {
    ErrorResponse,
    KeywordSearchRequest,
    KeywordSearchResponse,
} from "../../AbstractConnector";
import isErrorResponse from "../../utils/isErrorResponse";
import mapApiVertex from "../mappers/mapApiVertex";
import keywordSearchTemplate from "../templates/keywordSearchTemplate";
import type { OCVertex } from "../types";
import { OpenCypherFetch } from "../types";

type RawKeySearchResponse = {
    results: [
        {
            object: OCVertex;
        }
    ];
};

const keywordSearch = async (
openCypherFetch: OpenCypherFetch,
req: KeywordSearchRequest
): Promise<KeywordSearchResponse> => {
    const vertTypes = req.vertexTypes;
    let vertices: Array<Vertex> = [];

    if (vertTypes !== undefined) {
        for (let i = 0; i < vertTypes.length; i++) {
            let modifiedReq = req;
            modifiedReq.vertexTypes = [vertTypes[i]];
            const openCypherTemplate = keywordSearchTemplate(modifiedReq);
            const data = await openCypherFetch<RawKeySearchResponse | ErrorResponse>(
                openCypherTemplate
            );

            if (isErrorResponse(data)) {
                throw new Error(data.detailedMessage);
            }

            vertices = vertices.concat(data.results.map(value => {
                return mapApiVertex(value.object);
            }));
        }
    }

    return { vertices };
};

export default keywordSearch;
  