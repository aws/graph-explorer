// @vitest-environment happy-dom
import { vi } from "vitest";

import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import {
  activeConfigurationAtom,
  type AppStore,
  configurationAtom,
  schemaAtom,
} from "@/core";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  renderHookWithJotai,
} from "@/utils/testing";

import useTextTransform from "./useTextTransform";

async function initializeConfigWithPrefix(store: AppStore) {
  // Create config and setup schema
  const config = createRandomRawConfiguration();
  const schema = createRandomSchema();
  config.connection!.queryEngine = "sparql";
  schema.prefixes = [
    {
      prefix: "rdf" as RdfPrefix,
      uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#" as IriNamespace,
    },
  ];
  await store.set(configurationAtom, new Map([[config.id, config]]));
  await store.set(schemaAtom, new Map([[config.id, schema]]));

  // Make config active
  await store.set(activeConfigurationAtom, config.id);
}

describe("useTextTransform", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("should replace prefixes in URIs", async () => {
    const text = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    const expected = "rdf:type";
    const { result } = await renderHookWithJotai(
      () => useTextTransform(),
      initializeConfigWithPrefix,
    );
    expect(result.current(text)).toEqual(expected);
  });

  it("should not modify text", async () => {
    const text = "this is a test";
    const { result } = await renderHookWithJotai(() => useTextTransform());
    expect(result.current(text)).toBe(text);
  });

  it("should return the original text if no transformation is needed", async () => {
    const text = "This Is A Test";
    const { result } = await renderHookWithJotai(() => useTextTransform());
    expect(result.current(text)).toBe(text);
  });

  it("should handle empty string", async () => {
    const input = "";
    const { result } = await renderHookWithJotai(() => useTextTransform());
    expect(result.current(input)).toBe(input);
  });

  it("should handle strings with invalid characters", async () => {
    const input = "str\u{1F600}";
    const { result } = await renderHookWithJotai(() => useTextTransform());
    expect(result.current(input)).toBe(input);
  });

  // Boundary cases
  it("should return original input if it's a URI not in schema.prefixes", async () => {
    const input = "http://www.some-uri.com/";
    const { result } = await renderHookWithJotai(
      () => useTextTransform(),
      initializeConfigWithPrefix,
    );
    expect(result.current(input)).toBe(input);
  });

  it("should return original input if the connection.queryEngine is 'sparql' and input doesn't contain a URI", async () => {
    const input = "Some Text Without URI";

    const { result } = await renderHookWithJotai(
      () => useTextTransform(),
      initializeConfigWithPrefix,
    );

    expect(result.current(input)).toBe(input);
  });

  // Random data
  it("should handle random data", async () => {
    const input = "str\u{1F600}abcdef";
    const { result } = await renderHookWithJotai(() => useTextTransform());
    expect(result.current(input)).toBe(input);
  });
});
