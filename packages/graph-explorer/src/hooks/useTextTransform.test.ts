import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  JotaiStore,
  renderHookWithJotai,
} from "@/utils/testing";
import useTextTransform from "./useTextTransform";
import { vi } from "vitest";
import { schemaAtom } from "@/core/StateProvider/schema";

function initializeConfigWithPrefix(store: JotaiStore) {
  // Create config and setup schema
  const config = createRandomRawConfiguration();
  const schema = createRandomSchema();
  config.connection!.queryEngine = "sparql";
  schema.prefixes = [
    {
      prefix: "rdf",
      uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    },
  ];
  store.set(configurationAtom, new Map([[config.id, config]]));
  store.set(schemaAtom, new Map([[config.id, schema]]));

  // Make config active
  store.set(activeConfigurationAtom, config.id);
}

describe("useTextTransform", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("should replace prefixes in URIs", () => {
    const text = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    const expected = "rdf:type";
    const { result } = renderHookWithJotai(
      () => useTextTransform(),
      initializeConfigWithPrefix
    );
    expect(result.current(text)).toEqual(expected);
  });

  it("should not modify text", () => {
    const text = "this is a test";
    const { result } = renderHookWithJotai(() => useTextTransform());
    expect(result.current(text)).toBe(text);
  });

  it("should return the original text if no transformation is needed", () => {
    const text = "This Is A Test";
    const { result } = renderHookWithJotai(() => useTextTransform());
    expect(result.current(text)).toBe(text);
  });

  it("should handle empty string", () => {
    const input = "";
    const { result } = renderHookWithJotai(() => useTextTransform());
    expect(result.current(input)).toBe(input);
  });

  it("should handle strings with invalid characters", () => {
    const input = "str\u{1F600}";
    const { result } = renderHookWithJotai(() => useTextTransform());
    expect(result.current(input)).toBe(input);
  });

  // Boundary cases
  it("should return original input if it's a URI not in schema.prefixes", () => {
    const input = "http://www.some-uri.com/";
    const { result } = renderHookWithJotai(
      () => useTextTransform(),
      initializeConfigWithPrefix
    );
    expect(result.current(input)).toBe(input);
  });

  it("should return original input if the connection.queryEngine is 'sparql' and input doesn't contain a URI", () => {
    const input = "Some Text Without URI";

    const { result } = renderHookWithJotai(
      () => useTextTransform(),
      initializeConfigWithPrefix
    );

    expect(result.current(input)).toBe(input);
  });

  // Random data
  it("should handle random data", () => {
    const input = "str\u{1F600}abcdef";
    const { result } = renderHookWithJotai(() => useTextTransform());
    expect(result.current(input)).toBe(input);
  });
});
