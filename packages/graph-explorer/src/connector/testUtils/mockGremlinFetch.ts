const mockGremlinFetch = <TResult>() => {
  return async (queryTemplate: string) => {
    const url = "http://mock.test";
    const encodedQuery = encodeURIComponent(queryTemplate);

    const uri = `${url}?gremlin=${encodedQuery}`;

    const res = await fetch(uri);

    return res.json() as TResult;
  };
};

export default mockGremlinFetch;
