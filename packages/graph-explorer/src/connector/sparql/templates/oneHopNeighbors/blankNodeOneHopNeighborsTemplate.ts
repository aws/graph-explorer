/**
 * Fetch all neighbors and their predicates, values, and classes
 * given a blank node sub-query.
 *
 * @see oneHopNeighborsTemplate
 */
const blankNodeOneHopNeighborsTemplate = (subQuery: string) => {
  return `
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
};

export default blankNodeOneHopNeighborsTemplate;
