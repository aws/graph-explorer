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
