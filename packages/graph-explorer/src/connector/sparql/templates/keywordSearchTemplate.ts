import { SPARQLKeywordSearchRequest } from "../types";

/**
 * @example
 * searchTerm = "Ch"
 * subjectClasses = ["http://www.example.com/soccer/ontology/Team"]
 * predicates = [
 *   "http://www.example.com/soccer/ontology/teamName",
 *   "http://www.example.com/soccer/ontology/nickname"
 * ]
 * limit = 10
 * offset = 0
 * exactMatch = False
 *
 * SELECT ?subject ?pred ?value ?class {
 *   ?subject ?pred ?value {
 *     SELECT DISTINCT ?subject ?class {
 *         ?subject a          ?class ;
 *                  ?predicate ?value .
 *         FILTER (?predicate IN (
 *             <http://www.example.com/soccer/ontology/teamName>,
 *             <http://www.example.com/soccer/ontology/nickname>
 *         ))
 *         FILTER (?class IN (
 *             <http://www.example.com/soccer/ontology/Team>
 *         ))
 *         FILTER (regex(str(?value), "Ch", "i"))
 *     }
 *     LIMIT 10
 *     OFFSET 0
 *   }
 *   FILTER(!isBlank(?subject) && isLiteral(?value))
 * }
 */
const keywordSearchTemplate = ({
  searchTerm,
  subjectClasses = [],
  predicates = [],
  limit = 10,
  offset = 0,
  exactMatch = false,
}: SPARQLKeywordSearchRequest): string => {
  const getSubjectClasses = () => {
    if (!subjectClasses?.length) {
      return "";
    }

    let filterByClass = "";
    filterByClass += "FILTER (?class IN (";
    subjectClasses.forEach((sc, i) => {
      filterByClass += `<${sc}>`;
      if (i < subjectClasses.length - 1) {
        filterByClass += ", ";
      }
    });
    filterByClass += "))";
    return filterByClass;
  };

  const getFilterPredicates = () => {
    if (!predicates?.length) {
      return "";
    }

    let filterByAttributes = "";
    filterByAttributes += "FILTER (?predicate IN (";
    predicates.forEach((p, i) => {
      filterByAttributes += `<${p}>`;
      if (i < predicates.length - 1) {
        filterByAttributes += ", ";
      }
    });
    filterByAttributes += "))";
    return filterByAttributes;
  };

  const getFilterObject = () => {
    if (!searchTerm) {
      return "";
    }

    let filterBySearchTerm = "";
    if (exactMatch === true) {
      filterBySearchTerm = `FILTER (?value = "${searchTerm}"))`;
    } else {
      filterBySearchTerm = `FILTER (regex(str(?value), "${searchTerm}", "i"))`;
    }
    return filterBySearchTerm;
  };

  return `
    SELECT ?subject ?pred ?value ?class {
      ?subject ?pred ?value {
        SELECT DISTINCT ?subject ?class {
            ?subject a          ?class ;
                     ?predicate ?value .
            ${getFilterPredicates()}
            ${getSubjectClasses()}
            ${getFilterObject()}
        }
        ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ""}
      }
      FILTER(!isBlank(?subject) && isLiteral(?value))
    }
  `;
};

export default keywordSearchTemplate;
