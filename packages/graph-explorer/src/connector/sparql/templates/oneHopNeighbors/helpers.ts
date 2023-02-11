import { SPARQLCriterion } from "../../types";

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

  let filter = "FILTER(";
  filterCriteria.forEach((criterion, cI) => {
    filter += `(?sPred=<${criterion.predicate}> && regex(str(?sValue), "${criterion.object}", "i"))`;

    if (cI < filterCriteria.length - 1) {
      filter += " || ";
    }
  });
  filter += ")";
  return filter;
};

export const getLimit = (limit?: number, offset?: number) => {
  if (limit === 0) {
    return "";
  }
  return `LIMIT ${limit} OFFSET ${offset}`;
};
