import { SPARQLCriterion } from "../types";
import { query } from "@/utils";

export function getSubjectClasses(subjectClasses: string[]) {
  if (!subjectClasses?.length) {
    return "";
  }

  let classesValues = "VALUES ?subjectClass {";
  subjectClasses.forEach(c => {
    classesValues += ` <${c}>`;
  });
  classesValues += " }";
  return classesValues;
}

export function getFilters(filterCriteria: SPARQLCriterion[]) {
  if (!filterCriteria?.length) {
    return "";
  }

  const filtersTemplate = filterCriteria
    .map(
      c =>
        `(?sPred=<${c.predicate}> && regex(str(?sValue), "${c.object}", "i"))`
    )
    .join(" ||\n");

  return query`
    FILTER (
      ${filtersTemplate}
    )
  `;
}
