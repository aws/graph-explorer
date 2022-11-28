import { SPARQLNeighborsRequest } from "../types";

/**
 * Fetch all neighbors and their predicates, values, and classes.
 *
 * @example
 * resourceURI = "http://www.example.com/soccer/resource#EPL"
 * subjectClasses = [
 *   "http://www.example.com/soccer/ontology/Team",
 * ]
 * filterCriteria = [
 *   { predicate: "http://www.example.com/soccer/ontology/teamName", object: "Arsenal" },
 *   { predicate: "http://www.example.com/soccer/ontology/nickname", object: "Gunners" },
 * ]
 * limit = 2
 * offset = 0
 *
 * SELECT ?subject ?pred ?value ?subjectClass ?pToSubject ?pFromSubject {
 *   ?subject a     ?subjectClass;
 *            ?pred ?value {
 *     SELECT DISTINCT ?subject ?pToSubject ?pFromSubject {
 *       BIND(<http://www.example.com/soccer/resource#EPL> AS ?argument)
 *       VALUES ?subjectClass {
 *         <http://www.example.com/soccer/ontology/Team>
 *       }
 *       {
 *         ?argument ?pToSubject ?subject.
 *         ?subject a            ?subjectClass;
 *                  ?sPred       ?sValue .
 *         FILTER (
 *           (?sPred=<http://www.example.com/soccer/ontology/teamName> && regex(str(?sValue), "Arsenal", "i")) ||
 *           (?sPred=<http://www.example.com/soccer/ontology/nickname> && regex(str(?sValue), "Gunners", "i"))
 *         )
 *       }
 *       UNION
 *       {
 *         ?subject ?pFromSubject ?argument;
 *                  a             ?subjectClass;
 *                  ?sPred        ?sValue .
 *        FILTER (
 *           (?sPred=<http://www.example.com/soccer/ontology/teamName> && regex(str(?sValue), "Arsenal", "i")) ||
 *           (?sPred=<http://www.example.com/soccer/ontology/nickname> && regex(str(?sValue), "Gunners", "i"))
 *         )
 *       }
 *     }
 *     LIMIT 2
 *     OFFSET 0
 *   }
 *   FILTER(isLiteral(?value))
 * }
 */
const oneHopNeighborsTemplate = ({
  resourceURI,
  subjectClasses = [],
  filterCriteria = [],
  limit = 0,
  offset = 0,
}: SPARQLNeighborsRequest): string => {
  const getSubjectClasses = () => {
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

  const getFilters = () => {
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

  const getLimit = () => {
    if (limit === 0) {
      return "";
    }
    return `LIMIT ${limit} OFFSET ${offset}`;
  };

  return `
    SELECT ?subject ?pred ?value ?subjectClass ?pToSubject ?pFromSubject {
      ?subject a     ?subjectClass;
               ?pred ?value {
        SELECT DISTINCT ?subject ?pToSubject ?pFromSubject {
          BIND(<${resourceURI}> AS ?argument)
          ${getSubjectClasses()}
          {
            ?argument ?pToSubject ?subject.
            ?subject a         ?subjectClass;
                     ?sPred    ?sValue .
            ${getFilters()}
          }
          UNION
          {
            ?subject ?pFromSubject ?argument;
                     a         ?subjectClass;
                     ?sPred    ?sValue .
           ${getFilters()}
          }
        }
        ${getLimit()}
      }
      FILTER(isLiteral(?value))
    }
  `;
};

export default oneHopNeighborsTemplate;
