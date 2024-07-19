import dedent from "dedent";

/**
 * Fetch all neighbors and their predicates, values, and classes
 * given a blank node sub-query.
 *
 * @see oneHopNeighborsTemplate
 */
export default function blankNodeOneHopNeighborsTemplate(subQuery: string) {
  return dedent`
	  # Fetch all neighbors and their predicates, values, and classes given a blank node sub-query.
		SELECT ?bNode ?subject ?pred ?value ?subjectClass ?pToSubject ?pFromSubject {
			?subject a     ?subjectClass ;
							 ?pred ?value .
			{
				SELECT DISTINCT ?bNode ?subject ?pToSubject ?pFromSubject {
					{ ?bNode ?pToSubject ?subject }
					UNION
					{ ?subject ?subjectClass ?bNode }
					{ ${subQuery} }
				}
			}
			FILTER(isLiteral(?value))
		}
  `;
}
