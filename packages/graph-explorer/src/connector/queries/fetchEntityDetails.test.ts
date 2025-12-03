import { createRandomInteger } from "@shared/utils/testing";
import { toast } from "sonner";
import type { FetchEntityDetailsResult } from "./fetchEntityDetails";
import { createRandomEntities } from "@/utils/testing";

describe("notifyOnIncompleteRestoration", () => {
  it("should not show a notification when all entities were found", async () => {
    const { notifyOnIncompleteRestoration } = await import(
      "./fetchEntityDetails"
    );
    const fetchResult = createRandomFetchEntityDetailsResult();

    notifyOnIncompleteRestoration(fetchResult);

    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("should show a warning when some nodes and edges were not found", async () => {
    const { notifyOnIncompleteRestoration } = await import(
      "./fetchEntityDetails"
    );
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = createRandomInteger({ min: 2 });
    fetchResult.counts.notFound.edges = createRandomInteger({ min: 2 });
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;
    const nodeCount = fetchResult.counts.notFound.vertices.toLocaleString();
    const edgeCount = fetchResult.counts.notFound.edges.toLocaleString();

    notifyOnIncompleteRestoration(fetchResult);

    expect(toast.warning).toHaveBeenCalledWith(
      `Finished loading the graph, but ${nodeCount} nodes and ${edgeCount} edges were not found.`,
    );
  });

  it("should show a warning when exactly 1 node was not found", async () => {
    const { notifyOnIncompleteRestoration } = await import(
      "./fetchEntityDetails"
    );
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = 1;
    fetchResult.counts.notFound.edges = 0;
    fetchResult.counts.notFound.total = 1;

    notifyOnIncompleteRestoration(fetchResult);

    expect(toast.warning).toHaveBeenCalledWith(
      `Finished loading the graph, but 1 node was not found.`,
    );
  });

  it("should show a warning when exactly 1 edge was not found", async () => {
    const { notifyOnIncompleteRestoration } = await import(
      "./fetchEntityDetails"
    );
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = 0;
    fetchResult.counts.notFound.edges = 1;
    fetchResult.counts.notFound.total = 1;

    notifyOnIncompleteRestoration(fetchResult);

    expect(toast.warning).toHaveBeenCalledWith(
      `Finished loading the graph, but 1 edge was not found.`,
    );
  });

  it("should show a warning when no nodes or edges were imported", async () => {
    const { notifyOnIncompleteRestoration } = await import(
      "./fetchEntityDetails"
    );
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = [];
    fetchResult.entities.edges = [];

    notifyOnIncompleteRestoration(fetchResult);

    expect(toast.warning).toHaveBeenCalledWith(
      `Finished loading the graph, but no nodes or edges were loaded.`,
    );
  });
});

function createRandomFetchEntityDetailsResult(): FetchEntityDetailsResult {
  const entities = createRandomEntities();
  return {
    entities,
    counts: {
      notFound: {
        vertices: 0,
        edges: 0,
        total: 0,
      },
    },
  };
}
