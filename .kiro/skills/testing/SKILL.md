---
name: testing
description:
  Testing standards, patterns, and utilities for Graph Explorer including
  Vitest, DbState, renderHookWithState, test data factories, SPARQL test
  helpers, and backward compatibility testing for persisted data.
tools: ["fs_read", "code", "grep", "glob", "web_search", "web_fetch"]
---

# Testing Standards & Best Practices

## Quick Reference

```typescript
// Common testing imports
import {
  DbState,
  createTestableVertex,
  createTestableEdge,
  renderHookWithState,
} from "@/utils/testing";
import { createRandomName, createRandomInteger } from "@shared/utils/testing";
```

## Core Principles

- Prefer `renderHookWithState` over `renderHook` or `renderHookWithJotai`
- Prefer `DbState` over manual state management
- Prefer tests that limit mocks to external systems
- Always check `setupTests.ts` for global setup to avoid duplication

- Tests are co-located with source files (`*.test.ts` or `*.test.tsx`)
- Test utilities are in `src/utils/testing/` or `src/connector/testUtils/`
- Use Vitest for unit and integration tests
- Mock external dependencies and focus on component behavior

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
    expect.stringContaining("expected query pattern"),
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

## Test Execution Strategy

### Targeted Testing for Small Changes

For small, isolated changes, run only the relevant tests instead of the full
test suite:

```bash
# Run tests for a specific file
pnpm vitest --run <path-to-file>

# Run tests matching a pattern
pnpm vitest --run src/modules/SchemaGraph

# Run tests for files related to your changes
pnpm vitest --run src/connector/gremlin/fetchSchema
```

### When to Run Full Test Suite

Only run the full test suite (`pnpm test`) in these situations:

- At the end of implementing a large feature or set of changes
- Before creating a pull request
- After making changes that could have wide-reaching effects (e.g., shared
  utilities, core providers, type definitions)
- When explicitly requested

### Quick Validation with pnpm checks

For a quick validation of changes, run all static checks (type checking,
linting, and formatting) in a single command:

```bash
pnpm checks
```

This takes less than a minute and catches most issues without running the full
test suite. Use this as your default validation for small changes.

### Type Checking Only

For changes that don't have associated tests, verify type correctness:

```bash
pnpm check:types
```

This is faster than running the full test suite and catches most issues with
styling, configuration, or type-only changes.

## Best Practices

### Type Annotations

- For type annotation conventions, refer to `.kiro/skills/typescript/SKILL.md`

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

### Do Not Test Styling or Layout

- Do not write tests that assert on CSS classes, HTML element types, or layout
  structure
- These tests are fragile and break on routine visual changes that have no
  functional impact
- Instead, test the behavioral logic: conditional rendering, data
  transformations, user interactions, and state changes
- If a component is purely presentational with no branching logic, it does not
  need a test

### Performance

- Use `renderHookWithState()` for hook testing (includes query client setup)
- Disable retries in tests (handled automatically)
- Mock external dependencies to avoid network calls

### Error Testing

```typescript
test("should handle errors gracefully", async () => {
  const mockFetch = vi.fn().mockRejectedValue(new Error("Test error"));

  // Test error handling behavior
  await expect(functionUnderTest(mockFetch)).rejects.toThrow("Test error");
});
```

## Persistent Storage Backward Compatibility

Graph Explorer persists state to IndexedDB via localforage (managed through
Jotai atoms). When a type used in persistent storage changes shape — for
example, a property is added, removed, or renamed — previously stored data will
still be loaded with the old shape. This can silently break logic that assumes
the new shape.

### Requirements

Any type or object that is persisted through Jotai and localforage **must** have
tests that exercise the old storage shape alongside the new one. These tests
verify that:

1. Data in the old shape is accepted without errors
2. Logic that consumes the data produces correct results with both shapes
3. Old and new shapes can coexist (e.g., a mix of old and new entries in an
   array)

### Test Structure

Group backward-compatibility tests in a dedicated `describe` block with a clear
comment block explaining:

- What the old shape looked like
- Why the tests exist
- A warning not to delete or weaken them without confirming migration

```typescript
/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * <TypeName> is persisted to IndexedDB via localforage. Older versions stored
 * <description of old shape>. That property/shape has been changed to
 * <description of new shape>, but previously persisted data may still contain
 * the old form. These tests verify that <module> continues to work correctly
 * when given data in the old shape.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been migrated or that the old shape is no longer in the wild.
 */
describe("backward compatibility: <brief description>", () => {
  it("should handle data in the old shape", () => {
    // Use `as TypeName` to bypass compile-time checks and simulate
    // the old shape that TypeScript no longer allows.
    const legacyData = {
      ...currentFields,
      removedField: "old value",
    } as TypeName;

    const result = functionUnderTest(legacyData);
    expect(result).toEqual(expectedOutput);
  });

  it("should handle a mix of old and new shapes", () => {
    const legacy = { ...oldShape } as TypeName;
    const current = { ...newShape };
    const result = functionUnderTest([legacy, current]);
    expect(result).toEqual(expectedOutput);
  });
});
```

### Key Persisted Types

These types are stored in IndexedDB and require backward-compatibility tests
when modified:

- `SchemaStorageModel` — vertex/edge configs, prefixes, edge connections
- `PrefixTypeConfig` — RDF namespace prefix definitions
- `VertexTypeConfig` / `EdgeTypeConfig` — schema type configurations
- `RawConfiguration` — connection and schema configuration
- User preferences (`VertexPreferencesStorageModel`,
  `EdgePreferencesStorageModel`)

### When to Add These Tests

- Removing a property from a persisted type
- Renaming a property on a persisted type
- Changing the type of a property (e.g., `string[]` → `Set<string>`)
- Adding a required property (old data will not have it)
- Changing the semantics of an existing property
