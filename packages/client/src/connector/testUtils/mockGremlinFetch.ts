import { QueryOptions } from "../AbstractConnector";

const mockGremlinFetch = <TResult>(options?: QueryOptions) => {
  return async (queryTemplate: string) => {
    const url = "http://mock.test";
    const encodedQuery = encodeURIComponent(queryTemplate);

    const uri = `${url}?gremlin=${encodedQuery}`;

    const res = await fetch(uri, {
      signal: options?.abortSignal,
    });

    return res.json() as TResult;
  };
};

export default mockGremlinFetch;
