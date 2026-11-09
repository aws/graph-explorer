import type { Branded } from "@/utils";

import { UnrepresentableNumberError } from "./queryValueError";

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

/**
 * Text written out in full, with an optional sign and fraction, no leading
 * zeros, and no exponent or other syntax.
 *
 * Matches `0`, `25`, `-5`, and `1.5`. Does not match `NaN`, `Infinity`,
 * `1e+21`, `007`, or `10 extra`.
 */
const PLAIN_DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

/**
 * A numeric operand, emitted without delimiters so the database reads it as a
 * number rather than as text. Shared by every query language, because a plain
 * decimal cannot end a literal, open a comment, or start a clause in any of
 * them; a database reports a number its position does not accept.
 *
 * Throws `UnrepresentableNumberError` for text with no plain-decimal form: a
 * bare word (`NaN`, `Infinity`), an exponent form (`1e+21`), or a leading-zero
 * spelling such as `007`. The check is on the emitted text rather than the
 * value, because it is that text the database parses, so a value of any runtime
 * type meets the same rule.
 */
export function toNumberFragment(value: number): QueryFragment {
  const text = String(value);
  if (!PLAIN_DECIMAL.test(text)) {
    throw new UnrepresentableNumberError(value);
  }
  return toQueryFragment(text);
}

/**
 * The positions within a query whose value type the query language constrains:
 * an entity ID, a SPARQL IRI, and an openCypher identifier.
 */
export type FragmentPosition = "IRI" | "identifier" | "id";
