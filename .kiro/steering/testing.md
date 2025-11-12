# Testing Standards & Best Practices

## Test Data Creation

### Random Data Factories

Use the factory methods for random data generation to create test data that
doesn't directly impact test results:

- **Graph Explorer**: Use `@/utils/testing` for frontend-specific test data
- **Shared**: Use `@shared/utils/testing` for common utilities

```typescript
import {
  createRandomName,
  createRandomColor,
  createRandomInteger,
} from "@shared/utils/testing";
import { createTestableVertex, createTestableEdge } from "@/utils/testing";

// Create random data for setup that doesn't affect test logic
const randomVertexType = createRandomName("VertexType");
const randomColor = createRandomColor();
```

### Testable Entities

Prefer `TestableVertex` and `TestableEdge` over raw vertex/edge types for more
flexible test data:

```typescript
import { createTestableVertex, createTestableEdge } from "@/utils/testing";

// Create testable entities that can be transformed as needed
const vertex = createTestableVertex()
  .with({ types: ["Person"] })
  .withRdfValues(); // Convert to RDF format if needed

const edge = createTestableEdge()
  .with({ type: "knows" })
  .withSource(sourceVertex)
  .withTarget(targetVertex);

// Transform to different formats
const rawVertex = vertex.asVertex();
const resultVertex = vertex.asResult();
const patchedVertex = vertex.asPatchedResult();
```

## React Hook Testing

### Use renderHookWithState()

For testing React hooks, always use `renderHookWithState()` instead of the
standard `renderHook()`:

```typescript
import { renderHookWithState, DbState } from "@/utils/testing";

test("should handle vertex selection", () => {
  const state = new DbState();
  state.createVertexInGraph();

  const { result } = renderHookWithState(() => useVertexSelection(), state);

  // Test hook behavior
  expect(result.current.selectedVertices).toHaveLength(0);
});
```

### DbState for Test Setup

Use the `DbState` class to consistently set up Jotai state for tests:

```typescript
import {
  DbState,
  createTestableVertex,
  renderHookWithState,
} from "@/utils/testing";

test("should filter vertices by type", () => {
  const state = new DbState();

  // Add test data to the graph
  const vertex = createTestableVertex().with({ types: ["Person"] });
  state.addTestableVertexToGraph(vertex);

  // Configure filtering
  state.filterVertexType("Person");

  // Add styling
  state.addVertexStyle("Person", { color: "#ff0000" });

  const { result } = renderHookWithState(() => useFilteredVertices(), state);

  expect(result.current.filteredVertices).toHaveLength(1);
});
```

## Default Test Setup

### Depend on setupTests.ts

All tests automatically inherit the configuration from `setupTests.ts`, which
provides:

- **Consistent Environment**: UTC timezone, en-US locale
- **Mocked Dependencies**: localforage, logger, query client with no retries
- **Cleanup**: Automatic cleanup after each test
- **Global Mocks**: Intl, environment variables

Most tests require minimal additional setup beyond what's provided
automatically.

### Environment Variables

Tests run with `DEV=true` and `PROD=false` by default. Override when needed:

```typescript
test("should behave differently in production", () => {
  vi.stubEnv("PROD", true);
  vi.stubEnv("DEV", false);

  // Test production behavior
});
```

## Test Organization

### File Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Co-locate tests with source files when possible
- Use descriptive test names that explain the expected behavior

### Test Structure

```typescript
import {
  DbState,
  createTestableVertex,
  renderHookWithState,
} from "@/utils/testing";

describe("ComponentName", () => {
  test("should handle expected behavior", () => {
    // Arrange: Set up test data using random factories
    const state = new DbState();
    const testVertex = createTestableVertex().with({
      types: ["TestType"], // Only specify what matters for the test
    });
    state.addTestableVertexToGraph(testVertex);

    // Act: Execute the behavior being tested
    const { result } = renderHookWithState(() => useComponent(), state);

    // Assert: Verify the expected outcome
    expect(result.current.someProperty).toBe(expectedValue);
  });
});
```

## Testing Patterns

### Graph Data Testing

```typescript
import {
  DbState,
  createTestableVertex,
  createTestableEdge,
  renderHookWithState,
} from "@/utils/testing";

test("should process graph data correctly", () => {
  const state = new DbState();

  // Create connected vertices and edges
  const source = createTestableVertex().with({ types: ["Person"] });
  const target = createTestableVertex().with({ types: ["Company"] });
  const edge = createTestableEdge()
    .with({ type: "worksAt" })
    .withSource(source)
    .withTarget(target);

  state.addTestableEdgeToGraph(edge); // Automatically adds vertices too

  const { result } = renderHookWithState(() => useGraphData(), state);

  expect(result.current.vertices).toHaveLength(2);
  expect(result.current.edges).toHaveLength(1);
});
```

### Query Testing

```typescript
import { createRandomVertexId } from "@/utils/testing";

test("should generate correct query", async () => {
  const mockFetch = vi.fn().mockResolvedValue(mockResponse);

  await queryFunction(mockFetch, {
    vertexIds: [createRandomVertexId()],
  });

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining("expected query pattern")
  );
});
```

### Component Testing

```typescript
import { render, screen } from "@testing-library/react";
import { DbState, createTestableVertex, TestProvider } from "@/utils/testing";
import { createQueryClient } from "@/core/queryClient";
import { getAppStore } from "@/core";

test("should render vertex correctly", () => {
  const state = new DbState();
  const vertex = createTestableVertex().with({
    types: ["Person"],
    attributes: { name: "Test User" } // Only specify relevant attributes
  });
  state.addTestableVertexToGraph(vertex);

  // Set values on the Jotai store
  const store = getAppStore();
  state.applyTo(store);

  // Create the query client using the mock explorer
  const queryClient = createQueryClient({ explorer: state.explorer });
  const defaultOptions = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaultOptions,
    queries: { ...defaultOptions.queries, retry: false },
  });

  render(<VertexComponent />, {
    wrapper: ({ children }) => (
      <TestProvider client={queryClient} store={store}>
        {children}
      </TestProvider>
    )
  });

  expect(screen.getByText("Test User")).toBeInTheDocument();
});
```

## Test Assertions

### Use toStrictEqual() with Full Expected Arrays

Instead of checking array length and individual indices, use `toStrictEqual()`
with the complete expected array:

```typescript
// ❌ Avoid: Length check + individual index assertions
expect(result).toHaveLength(2);
expect(result[0]).toEqual(createResultScalar({ name: "?name", value: name1 }));
expect(result[1]).toEqual(createResultScalar({ name: "?name", value: name2 }));

// ✅ Prefer: Single assertion with full expected array
expect(result).toStrictEqual([
  createResultScalar({ name: "?name", value: name1 }),
  createResultScalar({ name: "?name", value: name2 }),
]);
```

**Benefits:**

- **Cleaner**: Single assertion instead of multiple checks
- **Stricter**: `toStrictEqual()` provides more thorough comparison than
  `toEqual()`
- **Readable**: Expected results are clearly visible in the test
- **Maintainable**: Changes only require updating one array
- **Better Errors**: Failure messages show full expected vs actual arrays

### SPARQL Test Helpers

For SPARQL-related tests, use the helper functions to create consistent test
data:

```typescript
import {
  createUriValue,
  createBNodeValue,
  createLiteralValue,
  createTestableVertex,
  createTestableEdge,
} from "@/utils/testing";
import { createRandomName, createRandomUrlString } from "@shared/utils/testing";

test("should parse SPARQL response", async () => {
  const name1 = createRandomName("Person");
  const name2 = createRandomName("Person");

  const mockResponse = {
    head: { vars: ["name"] },
    results: {
      bindings: [
        { name: createLiteralValue(name1) },
        { name: createLiteralValue(name2) },
      ],
    },
  };

  const result = await rawQuery(mockFetch, {
    query: "SELECT ?name WHERE { ?s ?p ?name }",
  });

  expect(result).toStrictEqual([
    createResultScalar({ name: "?name", value: name1 }),
    createResultScalar({ name: "?name", value: name2 }),
  ]);
});
```

### RDF Test Data

For RDF/SPARQL tests, use `.withRdfValues()` to generate appropriate URIs:

```typescript
test("should handle RDF construct query", async () => {
  const person1 = createTestableVertex().withRdfValues();
  const person2 = createTestableVertex().withRdfValues();
  const edge = createTestableEdge().withRdfValues();

  const mockResponse = {
    head: { vars: ["subject", "predicate", "object"] },
    results: {
      bindings: [
        {
          subject: createUriValue(edge.source.id),
          predicate: createUriValue(edge.type),
          object: createUriValue(edge.target.id),
        },
      ],
    },
  };

  const result = await rawQuery(mockFetch, {
    query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
  });

  expect(result).toStrictEqual([
    createResultEdge({
      id: edge.id,
      sourceId: edge.source.id,
      targetId: edge.target.id,
      type: edge.type,
      attributes: {},
    }),
  ]);
});
```

## Best Practices

### Data Isolation

- Use random data for setup that doesn't affect test logic
- Only specify the exact properties needed for the test
- Let random factories handle everything else

### Test Independence

- Each test should be independent and not rely on other tests
- Use `DbState` to create fresh state for each test
- Rely on automatic cleanup from `setupTests.ts`

### Meaningful Assertions

- Test behavior, not implementation details
- Use descriptive test names that explain the expected outcome
- Focus on the user-facing behavior when possible

### Performance

- Use `renderHookWithState()` for hook testing (includes query client setup)
- Disable retries in tests (handled automatically)
- Mock external dependencies to avoid network calls

### Error Testing

```typescript
test("should handle errors gracefully", () => {
  const mockFetch = vi.fn().mockRejectedValue(new Error("Test error"));

  // Test error handling behavior
  expect(async () => {
    await functionUnderTest(mockFetch);
  }).rejects.toThrow("Test error");
});
```
