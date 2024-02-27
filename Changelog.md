# graph-explorer Change Log

## Upcoming

## Release 1.5.1

This release includes the following feature enhancements and bug fixes:

**Bug fixes**

- Refactored API request options for non-IAM endpoints (<https://github.com/aws/graph-explorer/pull/230>)
- Enforced JSON response format for SPARQL queries (<https://github.com/aws/graph-explorer/pull/230>)
- Bumped `vite` to `4.5.2` (<https://github.com/aws/graph-explorer/pull/233>)
- Searching for text containing quotes now works.

## Release 1.5.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Added new Fetch Timeout option to the Connections UI (<https://github.com/aws/graph-explorer/pull/199>)

**Bug fixes**

- Fixed synchronization with high number of labels with long strings  (<https://github.com/aws/graph-explorer/pull/206>)
- Fixed loading spinner rotation when synchronizing schema (<https://github.com/aws/graph-explorer/pull/207>)
- Fixed node and edge counts not updating on connection re-synchronization (<https://github.com/aws/graph-explorer/pull/209>)
- Fixed issue with Transition2 findDOMNode deprecation (<https://github.com/aws/graph-explorer/pull/211>)
- Fixed highlight not persisting on selected graph element (<https://github.com/aws/graph-explorer/pull/187>)
- Bumped `@types/semver` to `7.5.2`
- Bumped `babel`, `postcss`, and `vite` to latest
- Bumped `crypto-js` to `4.2.0`
- Bumped `@adobe/css-tools` to `4.3.2`


## Release 1.4.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Added SageMaker Notebook support (<https://github.com/aws/graph-explorer/pull/178>)
- Added Default Connection support (<https://github.com/aws/graph-explorer/pull/108>)
- Added query language indicators to created connections (<https://github.com/aws/graph-explorer/pull/164>)
- Added match precision option to keyword search (<https://github.com/aws/graph-explorer/pull/175>)
- Added toggle for limit on retrieved vertex neighbors (<https://github.com/aws/graph-explorer/pull/176>)
- Added SageMaker Notebook hosting documentation (<https://github.com/aws/graph-explorer/pull/183>)
- Added ECS hosting documentation (<https://github.com/aws/graph-explorer/pull/174>)
- Updated Dockerfile base image to AL2022 (<https://github.com/aws/graph-explorer/pull/190>)

**Bug fixes**

- Fixed search UI crashing on node select/preview (<https://github.com/aws/graph-explorer/pull/177>)
- Fixed Gremlin/openCypher matching ID property on all keyword searches (<https://github.com/aws/graph-explorer/pull/169>)
- Fixed default connections failing on SageMaker for certain instance names (<https://github.com/aws/graph-explorer/pull/188>)
- Resolved deprecation warnings in GitHub workflows (<https://github.com/aws/graph-explorer/pull/181>)
- Patched vulnerable dependencies ([1](https://github.com/aws/graph-explorer/pull/182)) ([2](https://github.com/aws/graph-explorer/pull/189)) ([3](https://github.com/aws/graph-explorer/pull/191))

## Release 1.3.1

This patch release includes bugfixes for Release 1.3.0.

**Bug fixes**

- Fix proxy issue with non-IAM Neptune requests (<https://github.com/aws/graph-explorer/pull/166>)

## Release 1.3.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Support openCypher-based graph databases (<https://github.com/aws/graph-explorer/pull/129>)
- Added ability to search by vertex ID for Gremlin (<https://github.com/aws/graph-explorer/pull/113>)
- Improved logging visibility and user control (<https://github.com/aws/graph-explorer/pull/114>)
- Upgraded various dependencies to resolve Docker build warnings (<https://github.com/aws/graph-explorer/pull/118>)
- Improved synchronization interface in Connections UI (<https://github.com/aws/graph-explorer/pull/120>)
- Added coverage tests for the UI client package (<https://github.com/aws/graph-explorer/pull/130>)

**Bug fixes**

- Fix Expand Module scrollbar (<https://github.com/aws/graph-explorer/pull/131>)
- Fixed header generation for IAM authenticated Neptune requests (<https://github.com/aws/graph-explorer/pull/140>)
- Fixed calculation of neighbors count in Expand View sidebar (<https://github.com/aws/graph-explorer/pull/121>)
- Fixed proxy server not respecting `GRAPH_EXP_ENV_ROOT_FOLDER` value in .env (<https://github.com/aws/graph-explorer/pull/125>)

## Release 1.2.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Significantly reduced size of Docker image (<https://github.com/aws/graph-explorer/pull/104>)
- Improved schema synchronization performance via Summary API integration (<https://github.com/aws/graph-explorer/pull/80>)
- Improved error messaging when no/insufficient IAM role is found (<https://github.com/aws/graph-explorer/pull/81>)
- Updated Connections UI documentation for single server changes (<https://github.com/aws/graph-explorer/pull/59>)
- Added manual trigger for ECR updates (<https://github.com/aws/graph-explorer/pull/68>)

**Bug fixes**

- Fixed incorrect display of non-string IDs for Gremlin (<https://github.com/aws/graph-explorer/pull/60>)
- Fixed a database synchronization error caused by white spaces in labels for Gremlin requests (<https://github.com/aws/graph-explorer/pull/84>)

## Release 1.1.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Support for blank nodes when visualizing graphs using the RDF data model (<https://github.com/aws/graph-explorer/pull/48>)
- Enable Caching feature in the Connections UI which allows you to temporarily store data in the browser between sessions (<https://github.com/aws/graph-explorer/pull/48>)
- Simplify the setup by consolidating the build and serving the graph-explorer through port (<https://github.com/aws/graph-explorer/pull/52>)
- Moved self-signed SSL certificate creation to Docker entrypoint script (<https://github.com/aws/graph-explorer/pull/56>)

**Bug fixes**

- Fix an issue where the Graph Explorer is stuck in a loading state indefinitely due to expired credentials by refreshing credentials and retrying requests automatically (<https://github.com/aws/graph-explorer/pull/49>)

## Release 1.0.0

The first release of Graph Explorer, an Apache 2.0 React-based web application that enables users to visualize both property graph and RDF data and explore connections between data without having to write graph queries. Major features include:

- Ability to connect to graph databases like Amazon Neptune, or open-source endpoints like Gremlin Server or Blazegraph
- Search and preview starting nodes once connected to a graph database
- Visualize results in the Graph View & expand to view neighbors
- Customize the Graph View with preferred layouts, colors, icons, labels, and more
- Use Expand filters to customize the result set by filter text or count of results when expanding
- Scroll through the Table View to view the data in the Graph View in tabular format
- Use Table View filters when you need to highlight a subset of the data
- Download a CSV or JSON of the nodes and edges in visualization, or download as a PNG file
