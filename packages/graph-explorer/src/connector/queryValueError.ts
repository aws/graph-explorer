import type { QueryEngine } from "@shared/types";

import type { FragmentPosition } from "./queryFragment";

/**
 * A value could not be turned into query text.
 *
 * One class per failure, because the failures know different things: some are
 * specific to a position in a query, others are properties of the value itself.
 * The subclass constructor's parameter list is its discriminator.
 */
export abstract class QueryValueError extends Error {
  /** Structured context for the error details dialog. */
  abstract readonly details: object;

  /**
   * `name` is passed as a literal rather than derived from the class, because
   * the production build minifies class names. Requiring it here keeps a
   * subclass from silently reporting `Error` in the error details dialog.
   */
  protected constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

/**
 * The value cannot reach any database faithfully, whatever the query language or
 * position. Carries no language or position because neither affects the outcome.
 */
export abstract class UnrepresentableValueError extends QueryValueError {}

/**
 * A number with no plain-decimal text form: `NaN` and the infinities render as
 * bare words, and magnitudes outside roughly 1e-7 to 1e21 switch to exponential
 * notation (`1e+21`, `5e-7`). None of these are a numeric literal in any query
 * language, so the failure is a property of the value rather than the position.
 */
export class UnrepresentableNumberError extends UnrepresentableValueError {
  readonly value: number;

  constructor(value: number) {
    super(
      "UnrepresentableNumberError",
      `The value ${String(value)} has no plain-decimal form and cannot be used in a query.`,
    );
    this.value = value;
  }

  get details() {
    return { value: this.value, valueText: String(this.value) };
  }
}

/**
 * The value cannot be transmitted to any database: an unpaired surrogate has no
 * UTF-8 encoding, and graph data cannot hold a NUL (XSD `xsd:string` is defined
 * over XML's `Char` production, which excludes U+0000). Independent of language
 * and position — no query in any language can carry it — so it carries neither.
 */
export class UnrepresentableStringError extends UnrepresentableValueError {
  readonly value: string;

  constructor(value: string) {
    super(
      "UnrepresentableStringError",
      "This value contains characters that cannot be sent to a database.",
    );
    this.value = value;
  }

  get details() {
    return { value: this.value };
  }
}

/**
 * Throws if a value cannot be transmitted to any database. A guard rather than a
 * boolean predicate so a call site cannot forget to act on the result. The check
 * must run on the raw value: escaping (`JSON.stringify`) turns a NUL into the
 * six characters `\u0000` and a lone surrogate into `\ud800`, so a check after
 * escaping — in `toQueryFragment` or at the transport boundary — would inspect
 * escaped text and always pass.
 */
export function assertRepresentable(value: string): void {
  if (!value.isWellFormed() || value.includes("\0")) {
    throw new UnrepresentableStringError(value);
  }
}

/**
 * The position accepts a value, but not one of this type — a numeric ID where a
 * language only supports string IDs, or a non-string where an IRI is required.
 *
 * The value is reported rather than coerced: silently stringifying an ID or
 * rewriting an IRI would address a different entity than the caller asked for.
 */
export class UnsupportedValueTypeError extends QueryValueError {
  readonly language: QueryEngine;
  readonly position: FragmentPosition;
  readonly value: unknown;

  constructor(
    language: QueryEngine,
    position: FragmentPosition,
    value: unknown,
  ) {
    super(
      "UnsupportedValueTypeError",
      `The ${language} ${position} position does not support a value of type ${typeof value}.`,
    );
    this.language = language;
    this.position = position;
    this.value = value;
  }

  get details() {
    return {
      language: this.language,
      position: this.position,
      valueType: typeof this.value,
      value: this.value,
    };
  }
}

/**
 * An identifier that names nothing. An empty property key or label cannot select
 * anything, and emitting an empty delimited name would silently match a
 * different position.
 */
export class EmptyIdentifierError extends QueryValueError {
  readonly language: QueryEngine;

  constructor(language: QueryEngine) {
    super(
      "EmptyIdentifierError",
      `An empty ${language} identifier cannot be used in a query.`,
    );
    this.language = language;
  }

  get details() {
    return { language: this.language };
  }
}

/**
 * The value cannot be escaped for this position — the position's grammar offers
 * no escape mechanism for the characters it carries, so there is no faithful
 * query text to emit. Position-specific rather than an `UnrepresentableValueError`,
 * because the same character can be legal elsewhere: a space or `>` has no escape
 * inside a SPARQL IRI, yet a space is fine in a SPARQL string literal.
 *
 * The caller detects the offending characters, since only it knows the
 * position's grammar; this class only reports them.
 */
export class UnescapableValueError extends QueryValueError {
  readonly language: QueryEngine;
  readonly position: FragmentPosition;
  readonly value: string;
  readonly unescapableCharacters: readonly string[];

  constructor(
    language: QueryEngine,
    position: FragmentPosition,
    value: string,
    unescapableCharacters: readonly string[],
  ) {
    super(
      "UnescapableValueError",
      `The ${language} ${position} value contains characters that cannot be represented in a query.`,
    );
    this.language = language;
    this.position = position;
    this.value = value;
    this.unescapableCharacters = unescapableCharacters;
  }

  get details() {
    // Each entry is a single character the caller detected; codePointAt(0) is always defined.
    const codepoints = [...new Set(this.unescapableCharacters)]
      .map(char => char.codePointAt(0)!)
      .sort((a, b) => a - b);
    return {
      language: this.language,
      position: this.position,
      value: this.value,
      unescapableCharacters: codepoints.map(toCodepointLabel),
    };
  }
}

function toCodepointLabel(codepoint: number): string {
  return `U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`;
}
