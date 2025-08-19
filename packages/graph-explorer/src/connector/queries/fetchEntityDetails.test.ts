import { createRandomInteger } from "@shared/utils/testing";
import {
  createFetchEntityDetailsCompletionNotification,
  FetchEntityDetailsResult,
} from "./fetchEntityDetails";
import { createRandomEntities } from "@/utils/testing";

describe("createCompletionNotification", () => {
  it("should create a completion notification with 1 node and 1 edge", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = fetchResult.entities.vertices.slice(0, 1);
    fetchResult.entities.edges = fetchResult.entities.edges.slice(0, 1);

    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("success");
    expect(notification.message).toBe(
      "Finished loading 1 node and 1 edge from the graph file."
    );
  });

  it("should create a completion notification with multiple nodes and edges", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    const nodeCount = fetchResult.entities.vertices.length.toLocaleString();
    const edgeCount = fetchResult.entities.edges.length.toLocaleString();
    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("success");
    expect(notification.message).toBe(
      `Finished loading ${nodeCount} nodes and ${edgeCount} edges from the graph file.`
    );
  });

  it("should create a completion notification when some nodes and edges were not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = createRandomInteger({ min: 2 });
    fetchResult.counts.notFound.edges = createRandomInteger({ min: 2 });
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;
    const nodeCount = fetchResult.counts.notFound.vertices.toLocaleString();
    const edgeCount = fetchResult.counts.notFound.edges.toLocaleString();

    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but ${nodeCount} nodes and ${edgeCount} edges were not found.`
    );
  });

  it("should create a completion notification when exactly 1 node was not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = 1;
    fetchResult.counts.notFound.edges = 0;
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;

    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but 1 node was not found.`
    );
  });

  it("should create a completion notification when exactly 1 edge was not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = 0;
    fetchResult.counts.notFound.edges = 1;
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;

    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but 1 edge was not found.`
    );
  });

  it("should create a completion notification when all nodes and edges were not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = [];
    fetchResult.entities.edges = [];
    fetchResult.counts.notFound.vertices = createRandomInteger({ min: 2 });
    fetchResult.counts.notFound.edges = createRandomInteger({ min: 2 });
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;
    const nodeCount = fetchResult.counts.notFound.vertices.toLocaleString();
    const edgeCount = fetchResult.counts.notFound.edges.toLocaleString();

    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but ${nodeCount} nodes and ${edgeCount} edges were not found.`
    );
  });

  it("should create a completion notification when no nodes or edges were imported", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = [];
    fetchResult.entities.edges = [];
    const notification =
      createFetchEntityDetailsCompletionNotification(fetchResult);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `Finished loading the graph, but no nodes or edges were loaded.`
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
