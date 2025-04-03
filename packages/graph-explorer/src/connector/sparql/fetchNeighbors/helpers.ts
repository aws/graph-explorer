import dedent from "dedent";
import { SPARQLCriterion } from "../types";
import { indentLinesBeyondFirst } from "@/utils";

export const getSubjectClasses = (subjectClasses: string[]) => {
  if (!subjectClasses?.length) {
    return "";
  }

  let classesValues = "VALUES ?subjectClass {";
  subjectClasses.forEach(c => {
    classesValues += ` <${c}>`;
  });
  classesValues += " }";
  return classesValues;
};

export const getFilters = (filterCriteria: SPARQLCriterion[]) => {
  if (!filterCriteria?.length) {
    return "";
  }

  const filtersTemplate = filterCriteria
    .map(
      c =>
        `(?sPred=<${c.predicate}> && regex(str(?sValue), "${c.object}", "i"))`
    )
    .join(" ||\n");

  return dedent`
  FILTER (
    ${indentLinesBeyondFirst(filtersTemplate, "    ")}
  )`;
};

export const getLimit = (limit?: number, offset?: number) => {
  if (limit === 0) {
    return "";
  }
  return `LIMIT ${limit} OFFSET ${offset}`;
};
