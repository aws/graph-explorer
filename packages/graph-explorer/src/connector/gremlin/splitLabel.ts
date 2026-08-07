/**
 * Splits a Neptune composite label into its constituent labels on the `::`
 * multi-label delimiter.
 *
 * `::` is Neptune's reserved delimiter for joining multiple labels on a single
 * vertex (`g.addV("A::B")`), so a real segment is never empty. An empty segment
 * therefore signals that the `::` is not our separator — either the backend is a
 * generic TinkerPop server where `::` is an ordinary label character, or the
 * label is otherwise unexpected. In that case we keep the whole string rather
 * than guess at a split that would misidentify the label. See the ADR.
 */
export function splitLabel(label: string): string[] {
  const segments = label.split(DELIMITER);
  if (segments.some(segment => segment === "")) {
    return [label];
  }
  return segments;
}

/**
 * Neptune's delimiter is precisely two colons, so a run of one, three, or more
 * colons is part of a label and must not split. The lookarounds exclude a `::`
 * that has another colon on either side.
 */
const DELIMITER = /(?<!:)::(?!:)/;
