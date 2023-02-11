# SPARQL Connector
This connector implementation is used to perform requests to Neptune RDF database.

## Methods
### fetchSchema
It is used to fetch the database shape using the following steps:
1. Fetch all distinct classes their counts
2. For each class,
   1. fetch all predicates to literals
   2. map those predicates to know the shape of the class
3. Fetch all predicates to non-literals and their counts
4. Generate prefixes using the received URIs

### keywordSearch
It is used to search resources by different criteria 
(matching text, classes, predicates, ...)

###### Blank nodes results
RDF does not allow to make requests using the blank nodes IDs.
Therefore, if any resource is a Blank node, the __ID__ and the __query__
used to be found are stored in memory to be able to fetch its neighbors
in the case that the user requested by its neighbors.


### fetchNeighbors
It is used to discover all non-literal predicates connected to any
resource. It allows to the user filtering by different criteria.

###### Blank nodes results
If a node has been stored as Blank node, it should have its neighbors
in memory. So, by applying the filter criteria over the neighbors set,
allows the connector to mock the neighbors request using in-memory results.

At the same time, if any resource of non-blank nodes is a blank node,
it will store the __ID__ and the __query__ used to find the blank node when needed.


### fetchNeighborsCount
It will fetch the total number of connected non-literal objects and the
total number of them grouped by resource class. It does not fetch resources
associated information, only the class to know how the 
target resource is connected.

###### Blank nodes results
If the resource was stored as Blank node, and it does not have neighbors yet,
it will fetch all neighbors (counts and information) and store them in memory.
