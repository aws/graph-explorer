import type {
  Criterion,
  FilterAndSortRequest,
} from "@/connector/useGEFetchTypes";

import { escapeString } from "@/utils";

function escapeRegexLiteral(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function criterionNumberTemplate({ name, value }: Criterion): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return `has("${name}",eq(0))`;
  }
  return `has("${name}",eq(${num}))`;
}

function criterionStringTemplate(
  { name, value }: Criterion,
  exactMatch: boolean,
): string {
  const escaped = escapeString(String(value));
  const str = String(value);
  const numericValue = Number(value);
  const isNumeric =
    str.trim() !== "" &&
    Number.isFinite(numericValue) &&
    String(numericValue) === str.trim();

  if (isNumeric) {
    return `has("${name}",eq(${numericValue}))`;
  }
  if (exactMatch) {
    return `has("${name}","${escaped}")`;
  }
  const regexEscaped = escapeRegexLiteral(String(value));
  const pattern = `(?i).*${regexEscaped}.*`;
  return `has("${name}",regex("${escapeString(pattern)}"))`;
}

function criterionDateTemplate({ name, value }: Criterion): string {
  return `has("${name}",eq(datetime(${value})))`;
}

function criterionTemplate(criterion: Criterion, exactMatch: boolean): string {
  switch (criterion.dataType) {
    case "Number":
      return criterionNumberTemplate(criterion);
    case "Date":
      return criterionDateTemplate(criterion);
    case "String":
    case undefined:
    default:
      return criterionStringTemplate(criterion, exactMatch);
  }
}

/**
 * Builds a Gremlin traversal for g.V() with optional vertexTypes, filterCriteria,
 * sortingCriteria, and range.
 *
 * @example
 * vertexTypes = ["airport"]
 * filterCriteria = [{ name: "country", value: "US" }]
 * sortingCriteria = [{ name: "code", direction: "asc" }]
 * limit = 20, offset = 0
 *
 * g.V().hasLabel("airport").and(has("country",containing("US"))).order().by("code",asc).range(0,20)
 */
export default function filterAndSortTemplate({
  vertexTypes = [],
  filterCriteria = [],
  sortingCriteria = [],
  limit,
  offset = 0,
  exactMatch = false,
}: FilterAndSortRequest): string {
  let template = "g.V()";

  if (vertexTypes.length > 0) {
    const hasLabelContent = vertexTypes
      .flatMap(type => type.split("::"))
      .map(type => `"${type}"`)
      .join(",");
    template += `.hasLabel(${hasLabelContent})`;
  }

  if (filterCriteria.length > 0) {
    const andContent = filterCriteria
      .map(c => criterionTemplate(c, exactMatch))
      .join(", ");
    template += `.and(${andContent})`;
  }

  if (sortingCriteria.length > 0) {
    const byClauses = sortingCriteria
      .map(s => `.by("${s.name}",${s.direction === "desc" ? "desc" : "asc"})`)
      .join("");
    template += `.order()${byClauses}`;
  }

  if (limit != null && limit > 0) {
    template += `.range(${offset},${offset + limit})`;
  }

  return template;
}
