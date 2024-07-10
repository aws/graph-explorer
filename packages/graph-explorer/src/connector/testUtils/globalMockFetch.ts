import { shortHash } from "./shortHash";

const GREMLIN = "../gremlin/queries/__mock";
const RESPONSES_FILES_MAP: Record<string, string> = {
  "6281d1a5": `${GREMLIN}/vertices-schema.json`,
  "186857e1": `${GREMLIN}/vertices-labels-and-counts.json`,
  "2c38e2dd": `${GREMLIN}/edges-schema.json`,
  "7062d2e": `${GREMLIN}/edges-labels-and-counts.json`,
  "35be2501": `${GREMLIN}/should-return-1-random-node.json`,
  "54fa1494": `${GREMLIN}/should-return-airports-whose-code-matches-with-SFA.json`,
  "749bfe6f": `${GREMLIN}/should-return-all-neighbors-from-node-2018.json`,
  "37e14b1": `${GREMLIN}/should-return-all-neighbors-from-node-2018-counts.json`,
  "3332c010": `${GREMLIN}/should-return-filtered-neighbors-from-node-2018.json`,
  "40a4690b": `${GREMLIN}/should-return-filtered-neighbors-from-node-2018-counts.json`,
  "59bc2d43": `${GREMLIN}/should-return-neighbors-counts-for-node-123.json`,
};

const globalMockFetch = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.fetch = jest.fn(async (url: string) => {
    const key = shortHash(url);
    const filePath = RESPONSES_FILES_MAP[key];
    if (!filePath) {
      throw new Error(
        `Failed to find a response file in the map for key '${key}' and URL '${url}'`,
        { cause: { url } }
      );
    }
    const response = await import(filePath);
    return Promise.resolve({
      json: () => {
        return Promise.resolve(response);
      },
    });
  });
};

export default globalMockFetch;
