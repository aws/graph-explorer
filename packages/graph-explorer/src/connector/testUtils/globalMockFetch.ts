import { vi } from "vitest";

const GREMLIN = "../gremlin/__mock";
const RESPONSES_FILES_MAP_NEW = {
  "vertices-schema.json": `${GREMLIN}/vertices-schema.json`,
  "vertices-labels-and-counts.json": `${GREMLIN}/vertices-labels-and-counts.json`,
  "edges-schema.json": `${GREMLIN}/edges-schema.json`,
  "edges-labels-and-counts.json": `${GREMLIN}/edges-labels-and-counts.json`,
  "should-return-1-random-node.json": `${GREMLIN}/should-return-1-random-node.json`,
  "should-return-airports-whose-code-matches-with-SFA.json": `${GREMLIN}/should-return-airports-whose-code-matches-with-SFA.json`,
  "should-return-all-neighbors-from-node-2018.json": `${GREMLIN}/should-return-all-neighbors-from-node-2018.json`,
  "should-return-all-neighbors-from-node-2018-counts.json": `${GREMLIN}/should-return-all-neighbors-from-node-2018-counts.json`,
  "should-return-filtered-neighbors-from-node-2018.json": `${GREMLIN}/should-return-filtered-neighbors-from-node-2018.json`,
  "should-return-filtered-neighbors-from-node-2018-counts.json": `${GREMLIN}/should-return-filtered-neighbors-from-node-2018-counts.json`,
  "should-return-neighbors-counts-for-node-123.json": `${GREMLIN}/should-return-neighbors-counts-for-node-123.json`,
};
type FileName = keyof typeof RESPONSES_FILES_MAP_NEW;

/**
 * Stubs out the fetch function and returns the contents of the given file or files.
 *
 * @param fileNames The file to use for a response. The order of files corresponds to the order of calls to the mock.
 */
export function globalMockFetch(...fileNames: FileName[]) {
  const mockFetch = vi.fn();

  // Add a response for each file given
  for (const fileName of fileNames) {
    // Respond with the contents of the file
    const filePath = RESPONSES_FILES_MAP_NEW[fileName];

    // Only respond once with this response
    mockFetch.mockImplementationOnce(async () => {
      const response = await import(filePath);
      return Promise.resolve({
        json: () => {
          return Promise.resolve(response);
        },
      });
    });
  }

  vi.stubGlobal("fetch", mockFetch);
}
