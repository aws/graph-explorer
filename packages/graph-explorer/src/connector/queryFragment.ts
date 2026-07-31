import type { QueryEngine } from "@shared/types";

import type { Branded } from "@/utils";

/**
 * A piece of query text that a template can interpolate without adding
 * delimiters of its own, because the fragment already carries whatever
 * delimiters its position requires.
 *
 * Produced by the per-query-language fragment modules — see
 * `src/connector/<query-language>/fragments.ts`. One language's fragment is not
 * valid in another.
 */
export type QueryFragment = Branded<string, "QueryFragment">;

/**
 * Marks text as a Query Fragment. The single place a fragment is minted, so
 * every construction path is auditable through the fragment modules.
 */
export function toQueryFragment(text: string): QueryFragment {
  return text as QueryFragment;
}

/** The position within a query that a fragment constructor fills. */
export type FragmentPosition = "IRI" | "identifier" | "id" | "value";

/**
 * Converts a value to a finite number, or `undefined` when it is not one.
 *
 * Deliberately stricter than `Number(...)`, which maps `""`, `null`, and `[]` to
 * `0` — a numeric comparison against a blank or absent value would silently
 * compare against zero rather than reporting that the value cannot be used.
 */
export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : undefined;
}

/**
 * Why a value could not be turned into a fragment for the position it was
 * given:
 *
 * - `unsupported-type` — the value's type is not one the position accepts, such
 *   as a numeric ID where the language only allows string IDs.
 * - `empty` — an empty identifier, which cannot name anything.
 * - `forbidden-characters` — the value contains characters the position cannot
 *   represent and cannot escape, such as a SPARQL IRI containing a character
 *   the IRI syntax forbids.
 */
export type InvalidFragmentReason =
  | "unsupported-type"
  | "empty"
  | "forbidden-characters";

/**
 * Raised by a fragment constructor when a value cannot be placed into the
 * query position it was given. The value is reported rather than coerced,
 * because silently changing it — stringifying an ID, percent-encoding or
 * stripping characters from an IRI — would address a different entity than the
 * caller asked for. Callers that build a user-triggered query (search, filter)
 * catch this to tell the user the value cannot be used, instead of letting a
 * malformed query reach the database.
 *
 * One error type usable across every language, so consumers handle one shape.
 * The `language`, `position`, and `reason` fields let a consumer describe what
 * went wrong without parsing the message text, and `value` is kept in its
 * original type so the error details dialog can show it faithfully.
 *
 * Construct through the static factories rather than the constructor: each
 * names a specific failure and owns the wording, so no call site assembles the
 * shape by hand.
 */
export class InvalidFragmentValueError extends Error {
  /** The query language whose constructor rejected the value. */
  readonly language: QueryEngine;
  /** The position that could not accept the value. */
  readonly position: FragmentPosition;
  /** Which construction rule the value failed. */
  readonly reason: InvalidFragmentReason;
  /** The offending value, unmodified, for logging and message context. */
  readonly value: unknown;

  private constructor(
    language: QueryEngine,
    position: FragmentPosition,
    reason: InvalidFragmentReason,
    value: unknown,
  ) {
    super(deriveMessage(language, position, reason, value));
    this.name = "InvalidFragmentValueError";
    this.language = language;
    this.position = position;
    this.reason = reason;
    this.value = value;
  }

  /**
   * The value's type is not one the position supports — e.g. a numeric ID
   * where a language only accepts string IDs, or a non-string where an IRI
   * reference is required.
   */
  static unsupportedType(
    language: QueryEngine,
    position: FragmentPosition,
    value: unknown,
  ): InvalidFragmentValueError {
    return new InvalidFragmentValueError(
      language,
      position,
      "unsupported-type",
      value,
    );
  }

  /** An identifier is empty, so it cannot name an attribute or type. */
  static emptyIdentifier(
    language: QueryEngine,
    position: FragmentPosition,
  ): InvalidFragmentValueError {
    return new InvalidFragmentValueError(language, position, "empty", "");
  }

  /**
   * The value contains characters the position cannot represent and cannot
   * escape — most notably a SPARQL IRI containing a character the IRI syntax
   * forbids.
   */
  static forbiddenCharacters(
    language: QueryEngine,
    position: FragmentPosition,
    value: string,
  ): InvalidFragmentValueError {
    return new InvalidFragmentValueError(
      language,
      position,
      "forbidden-characters",
      value,
    );
  }
}

/** Builds the technical message from the error's fields, in one place. */
function deriveMessage(
  language: QueryEngine,
  position: FragmentPosition,
  reason: InvalidFragmentReason,
  value: unknown,
): string {
  switch (reason) {
    case "unsupported-type":
      return `The ${language} ${position} position does not support a value of type ${typeof value}.`;
    case "empty":
      return `An empty ${language} ${position} cannot be used in a query.`;
    case "forbidden-characters":
      return `The ${language} ${position} value contains characters that cannot be represented in a query.`;
  }
}
