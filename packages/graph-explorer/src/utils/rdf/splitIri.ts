import type { IriLocalValue, IriNamespace, IriParts } from "./types";

/**
 * Splits an IRI string into its namespace and local value.
 *
 * For hash IRIs like `http://example.org/ontology#Person`, the namespace is
 * `http://example.org/ontology#` and the value is `Person`. The split occurs
 * at the last `#`.
 *
 * For slash IRIs like `http://example.org/resource/London`, the namespace is
 * `http://example.org/resource/` and the value is `London`.
 *
 * The local value is validated using a blocklist of invalid characters.
 * Values containing spaces, angle brackets (`<>`), curly braces (`{}`),
 * pipes (`|`), carets (`^`), backticks (`` ` ``), backslashes (`\`), or
 * `#` are rejected. All other characters — including letters, digits,
 * underscores, hyphens, periods, percent-encoded sequences, and Unicode
 * letters — are accepted.
 *
 * Returns `null` if the string is not a valid IRI, has no namespace/value,
 * or the local value contains invalid characters.
 */
export function splitIri(iri: string): IriParts | null {
  let url: URL;
  try {
    url = new URL(iri);
  } catch {
    return null;
  }

  // Reject URIs without a real origin (e.g. urn:, mailto:, custom-scheme:)
  if (url.origin === "null") {
    return null;
  }

  // Reject file URIs
  if (url.protocol === "file:") {
    return null;
  }

  // Hash IRI: split on the last `#`
  const hashIndex = iri.lastIndexOf("#");
  if (hashIndex !== -1) {
    const value = iri.substring(hashIndex + 1);
    if (!value || !isValidLocalValue(value)) {
      return null;
    }
    const namespace = iri.substring(0, hashIndex + 1);
    return {
      namespace: namespace as IriNamespace,
      value: value as IriLocalValue,
    };
  }

  // Slash IRI: need a path beyond just "/"
  if (url.pathname === "/" || url.pathname === "") {
    return null;
  }

  const lastSlash = iri.lastIndexOf("/");
  const value = iri.substring(lastSlash + 1);
  if (!value || !isValidLocalValue(value)) {
    return null;
  }

  const namespace = iri.substring(0, lastSlash + 1);
  return {
    namespace: namespace as IriNamespace,
    value: value as IriLocalValue,
  };
}

/**
 * Validates a local value against a permissive character set. Rejects values
 * containing invalid characters: spaces, angle brackets, curly braces, pipes,
 * carets, backticks, backslashes, and unescaped `#`.
 */
const INVALID_LOCAL_VALUE = /[\s<>{}|^`\\#]/;
function isValidLocalValue(value: string): boolean {
  return !INVALID_LOCAL_VALUE.test(value);
}
