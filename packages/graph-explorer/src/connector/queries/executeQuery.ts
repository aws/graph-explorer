export function executeQuery(query: string, updateSchema: UpdateSchemaHandler) {
  return queryOptions({
    queryKey: ["execute", query],
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.rawQuery({ query }, { signal });

      // Update the schema and the cache
      updateVertexDetailsCache(client, results.vertices);
      updateEdgeDetailsCache(client, results.edges);

      // Fetch any details for fragments
      const details = await fetchEntityDetails(
        results.vertices.map(v => v.id),
        results.edges.map(e => e.id),
        client
      );

      // Recombine results with full details
      const combinedResults = toMappedQueryResults({
        ...results,
        vertices: details.entities.vertices,
        edges: details.entities.edges,
      });

      updateSchema(combinedResults);

      return combinedResults;
    },
  });
}
