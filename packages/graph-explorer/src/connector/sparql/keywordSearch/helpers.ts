import { escapeString } from "@/utils";
import { idParam } from "../idParam";

export function getSubjectClasses(subjectClasses?: string[]) {
  if (!subjectClasses?.length) {
    return "";
  }

  return `FILTER (?class IN (${subjectClasses.map(idParam).join(", ")}))`;
}

export function getFilterPredicates(predicates?: string[]) {
  const filteredPredicates = predicates?.filter(p => p !== "__all") || [];
  if (!filteredPredicates.length) {
    return "";
  }

  return `FILTER (?pValue IN (${filteredPredicates.map(idParam).join(", ")}))`;
}

export function getFilterObject(exactMatch?: boolean, searchTerm?: string) {
  if (!searchTerm) {
    return "";
  }

  const escapedSearchTerm = escapeString(searchTerm);

  let filterBySearchTerm = "";
  if (exactMatch === true) {
    filterBySearchTerm = `FILTER (?value = "${escapedSearchTerm}")`;
  } else {
    filterBySearchTerm = `FILTER (regex(str(?value), "${escapedSearchTerm}", "i"))`;
  }
  return filterBySearchTerm;
}
