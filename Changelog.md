# graph-explorer Change Log

## Upcoming

- **Improved** styling on icon buttons
  ([#675](https://github.com/aws/graph-explorer/pull/675))

## Release 1.11.0

### What's New

This release includes a big change to search and substantial improvements to the
Docker image. As always, there are many additional small fixes and improvements
that round out this release.

#### Search Sidebar

With this release, we've moved search out of the top navigation bar and in to
the sidebar. This means for new users when they first open Graph Explorer
they'll be presented with a set of search results that they can add in to the
graph and start exploring.

For existing users, you'll benefit from a better experience with search. Your
filters will remain active as you navigate around. It'll also do its best to
keep your selections for attribute when you change the node type. There's also a
new "Add All" button, when you want to add all the search results to the graph
with a single click.

#### Docker Image

The Docker image size had become a bit bloated over time. We took a look at what
was going on and discovered we were shipping all of our dev dependencies in the
Docker image when these are entirely unnecessary.

Once we stripped those out, along with some additional unnecessary files, we
ended up with a Docker image that is 196 MB lighter. This should make
downloading Graph Explorer from the repository much faster for everyone,
including any Neptune Notebook instances you have.

### What's Changed

- **Improved** search discoverability and ergonomics by moving the UI in to the
  sidebar [#665](https://github.com/aws/graph-explorer/pull/665)
- **Improved** UI responsiveness by using map instead of array for large data
  sets [#658](https://github.com/aws/graph-explorer/pull/658)
- **Improved** connection selection can now happen on any part of the connection
  row [#657](https://github.com/aws/graph-explorer/pull/657)
- **Improved** style for the sidebar buttons
  [#651](https://github.com/aws/graph-explorer/pull/651)
- **Improved** styles in the context menu to be easier to read
  ([#670](https://github.com/aws/graph-explorer/pull/670))
- **Improved** Docker image size, reducing it by 196 MB
  ([#619](https://github.com/aws/graph-explorer/pull/619))
- **Improved** query when searching across all node types
  ([#607](https://github.com/aws/graph-explorer/pull/607))
- **Improved** query generation by removing empty lines
  ([#608](https://github.com/aws/graph-explorer/pull/608))
- **Fixed** scrolling on search result details
  [#657](https://github.com/aws/graph-explorer/pull/657)
- **Fixed** Docker image containing more files than necessary.
  ([#613](https://github.com/aws/graph-explorer/pull/613))
- **Fixed** conflict when a node has a property named "id" that prevented
  changing the display attribute.
  ([#626](https://github.com/aws/graph-explorer/pull/626))
- **Fixed** style issue where buttons have a halo around them after being
  clicked ([#650](https://github.com/aws/graph-explorer/pull/650))
- **Fixed** security vulnerabilities in the Docker image from dev dependencies
  remaining in the image
  ([#616](https://github.com/aws/graph-explorer/pull/616))
- **Fixed** minor layout issue on connections screen
  ([#648](https://github.com/aws/graph-explorer/pull/648),
  [#670](https://github.com/aws/graph-explorer/pull/670))
- **Updated** multiple dependencies
  ([#611](https://github.com/aws/graph-explorer/pull/611),
  [#614](https://github.com/aws/graph-explorer/pull/614),
  [#616](https://github.com/aws/graph-explorer/pull/616),
  [#624](https://github.com/aws/graph-explorer/pull/624))

## Release 1.10.1

- **Improved** support for databases with thousands of node & edge types
  ([#599](https://github.com/aws/graph-explorer/pull/599))
- **Improved** logging on server and around schema sync
  ([#604](https://github.com/aws/graph-explorer/pull/604))
- **Fixed** context menu styles
  ([#600](https://github.com/aws/graph-explorer/pull/600))
- **Fixed** alignment of close button in search panel
  ([#603](https://github.com/aws/graph-explorer/pull/603))

## Release 1.10.0

This release includes some new features to make managing and supporting Graph
Explorer more friendly.

**Major Changes**

- **Added** backup & restore options for Graph Explorer local data
  ([#549](https://github.com/aws/graph-explorer/pull/549))
- **Added** about screen that includes a link to submit feedback
  ([#549](https://github.com/aws/graph-explorer/pull/549))
- **Improved** logging & error handling to aid in support
  - **Added** global error page if the React app crashes
    ([#547](https://github.com/aws/graph-explorer/pull/547))
  - **Added** optional server logging of database queries when using the proxy
    server which can be enabled within settings
    ([#574](https://github.com/aws/graph-explorer/pull/574),
    [#575](https://github.com/aws/graph-explorer/pull/575))
  - **Improved** handling of server errors with more consistent logging
    ([#557](https://github.com/aws/graph-explorer/pull/557))
  - **Improved** SageMaker Lifecycle script handling of CloudWatch log driver
    failures ([#550](https://github.com/aws/graph-explorer/pull/550))
  - **Improved** parsing of environment values in proxy server resulting in an
    error when the values are invalid
    ([#574](https://github.com/aws/graph-explorer/pull/574))

**Bug Fixes and Minor Changes**

- **Fixed** performance issue in styling sidebar panels when many node & edge
  types exist ([#542](https://github.com/aws/graph-explorer/pull/542))
- **Fixed** issue with upper case characters in RDF URIs
  ([#544](https://github.com/aws/graph-explorer/pull/544))
- **Improved** app styles
  ([#543](https://github.com/aws/graph-explorer/pull/543),
  [#548](https://github.com/aws/graph-explorer/pull/548))
- **Changed** Node to run in production mode
  ([#558](https://github.com/aws/graph-explorer/pull/558))
- **Removed** hosting production server using the client side Vite
  configuration, requiring the use of the proxy server
  ([#565](https://github.com/aws/graph-explorer/pull/565))
- **Transition** to Tailwind instead of EmotionCSS for styles, which should make
  updating the UI much simpler
  ([#543](https://github.com/aws/graph-explorer/pull/543))
- **Updated** multiple dependencies
  ([#555](https://github.com/aws/graph-explorer/pull/555),
  [#557](https://github.com/aws/graph-explorer/pull/557))

## Release 1.9.0

This release includes many fixes and enhancements that make using Graph Explorer
a more pleasant experience, especially for users with larger databases.

**Major Changes**

- **Improved** error experience in search and Data Explorer UI that includes a
  retry button ([#477](https://github.com/aws/graph-explorer/pull/477))
- **Improved** empty state experience in Data Explorer UI
  ([#477](https://github.com/aws/graph-explorer/pull/477))
- **Improved** search using openCypher which will now execute a single request
  when searching across all labels
  ([#493](https://github.com/aws/graph-explorer/pull/493),
  [#532](https://github.com/aws/graph-explorer/pull/532))
- **Improved** error messages for node expansion
  ([#502](https://github.com/aws/graph-explorer/pull/502))
- **Improved** Gremlin schema sync performance on larger databases, thanks to
  @dsaban-lightricks for his great suggestion in issue #225
  ([#498](https://github.com/aws/graph-explorer/pull/498))
- **Reduced** chance of throttling issues when a large amount of requests are
  executed in parallel by batching requests in groups of 10
  ([#489](https://github.com/aws/graph-explorer/pull/489))
- **Reduced** unnecessary search queries when no search term is provided by
  ignoring attribute and exact match changes
  ([#473](https://github.com/aws/graph-explorer/pull/473))
- **Improved** diagnostic logging in Neptune Notebooks by adding CloudWatch logs
  ([#517](https://github.com/aws/graph-explorer/pull/517))
  - Check out the example
    [lifecycle script](additionaldocs/sagemaker/install-graph-explorer-lc.sh)
    and IAM policies for
    [Neptune](additionaldocs/sagemaker/graph-explorer-neptune-db-policy.json)
    and
    [Neptune Analytics](additionaldocs/sagemaker/graph-explorer-neptune-analytics-policy.json)

**Bug Fixes and Minor Changes**

- **Fixed** issue with default connections when Neptune Notebook instance is
  restarted ([#508](https://github.com/aws/graph-explorer/pull/508))
- **Fixed** expanding a node on old versions of Gremlin
  ([#503](https://github.com/aws/graph-explorer/pull/503))
- **Fixed** default selection of expand type to be the first available type for
  expansion ([#501](https://github.com/aws/graph-explorer/pull/501))
- **Fixed** some SPARQL endpoints by using `application/sparql-results+json`
  accept header for SPARQL requests
  ([#499](https://github.com/aws/graph-explorer/pull/499))
- **Fixed** CORS issue for some SPARQL and Gremlin endpoints due to `queryId` in
  the request headers ([#529](https://github.com/aws/graph-explorer/pull/529))
  ([#499](https://github.com/aws/graph-explorer/pull/499))
- **Fixed** text wrapping for labels in edge styling sidebar
  ([#499](https://github.com/aws/graph-explorer/pull/499))
- **Fixed** potential error when the request body is very large by increasing
  the body size limit for proxy server
  ([#488](https://github.com/aws/graph-explorer/pull/488))
- **Fixed** issue when selecting an item in search results that resulted in
  errors in the browser console
  ([#474](https://github.com/aws/graph-explorer/pull/474))
- **Added** type checking and linting to server code
  (<https://github.com/aws/graph-explorer/pull/522>)
- **Added** environment values to override HTTP and HTTPS ports for proxy server
  ([#500](https://github.com/aws/graph-explorer/pull/500))
  - `PROXY_SERVER_HTTP_PORT` default is 80
  - `PROXY_SERVER_HTTPS_PORT` default is 443
- **Updated** development scripts updated to be more consistent with the
  industry ([#487](https://github.com/aws/graph-explorer/pull/487),
  [#525](https://github.com/aws/graph-explorer/pull/525))
  - Run the dev environment `pnpm dev`
  - Build & run the production environment `pnpm build && pnpm start`
  - Clean build artifacts with `pnpm clean`
- **Fixed** running in production mode locally with Node
  ([#500](https://github.com/aws/graph-explorer/pull/500))
- **Updated** multiple dependencies
  ([#475](https://github.com/aws/graph-explorer/pull/475),
  [#486](https://github.com/aws/graph-explorer/pull/486),
  [#490](https://github.com/aws/graph-explorer/pull/490),
  [#492](https://github.com/aws/graph-explorer/pull/492),
  [#491](https://github.com/aws/graph-explorer/pull/491),
  [#522](https://github.com/aws/graph-explorer/pull/522),
  [#523](https://github.com/aws/graph-explorer/pull/523))

## Release 1.8.0

**Major Changes**

- Better UX around neighbor expansion

  - Expand up to 10 additional neighbors when double clicking a node
    (<https://github.com/aws/graph-explorer/pull/455>,
    <https://github.com/aws/graph-explorer/pull/465>)
  - Improved reliability of node double click detection
    (<https://github.com/aws/graph-explorer/pull/453>)
  - Progress and errors are reported in notifications
    (<https://github.com/aws/graph-explorer/pull/434>)
  - Added ability to set a max limit for neighbor expansion per connection
    (<https://github.com/aws/graph-explorer/pull/447>)
  - Improved scrolling behavior in expand sidebar
    (<https://github.com/aws/graph-explorer/pull/436>)
  - Added caching and retries for failed requests
    (<https://github.com/aws/graph-explorer/pull/434>)

- Better UX around node counts

  - Progress and errors are reported in notifications when any are happening
    (<https://github.com/aws/graph-explorer/pull/434>)
  - Progress and errors are shown for selected node in the expand side bar
    (<https://github.com/aws/graph-explorer/pull/463>)
  - Added caching and retries for failed requests
    (<https://github.com/aws/graph-explorer/pull/434>)

- Added support for Gremlin Server 3.7
  (<https://github.com/aws/graph-explorer/pull/411>)

**Bug Fixes and Minor Changes**

- Fixed many bugs around neighbor expansion and counts for openCypher
  (<https://github.com/aws/graph-explorer/pull/449>)
  - Fixed expand limit to be type based when expanding from sidebar
  - Fixed expand query to respect limit and offset properly so multiple
    expansions return unique results
  - Fixed expand query so all edges are returned between source and target nodes
- Improved performance and reliability of Gremlin neighbor expansion query
  (<https://github.com/aws/graph-explorer/pull/454>)
- Remove extraneous openCypher query when expanding nodes
  (<https://github.com/aws/graph-explorer/pull/431>)
- Fixed edge case where node badges are stale
  (<https://github.com/aws/graph-explorer/pull/427>)
- Fixed server starting log message
  (<https://github.com/aws/graph-explorer/pull/416>)
- Refactored several graph views for readability
  (<https://github.com/aws/graph-explorer/pull/419>)
- Improved testing coverage by having less mocked logic
  (<https://github.com/aws/graph-explorer/pull/421>)
- Fixed issue where the connection's fetch timeout input would disappear when
  string is empty (<https://github.com/aws/graph-explorer/pull/445>)
- Fixed issue where long connection URLs had no vertical padding
  (<https://github.com/aws/graph-explorer/pull/445>)
- Updated to TypeScript 5.5 (<https://github.com/aws/graph-explorer/pull/451>)

## Release 1.7.0

This release includes the following feature enhancements and bug fixes:

**Major Changes**

- Updated to Node v20 & React v18
  (<https://github.com/aws/graph-explorer/pull/330>)
  (<https://github.com/aws/graph-explorer/pull/345>)
  (<https://github.com/aws/graph-explorer/pull/352>)
- Added schema updating automatically when an unknown attribute is discovered
  (<https://github.com/aws/graph-explorer/pull/356>)
- Improved error handling on the client and server side
  (<https://github.com/aws/graph-explorer/pull/283>)
  (<https://github.com/aws/graph-explorer/pull/288>)
- Removed fetch caching options
  (<https://github.com/aws/graph-explorer/pull/280>)

**Bug Fixes and Minor Changes**

- Fixed node and edge filter behavior
  (<https://github.com/aws/graph-explorer/pull/289>)
- Fixed error on CSV export when "keep filtering and sorting"
  (<https://github.com/aws/graph-explorer/pull/297>)
- Fixed uploaded SVG rendering in graph
  (<https://github.com/aws/graph-explorer/pull/296>)
- Fixed search bar hover color
  (<https://github.com/aws/graph-explorer/pull/293>)
- Fixed Docker image tagging in GitHub workflows
  (<https://github.com/aws/graph-explorer/pull/320>)
- Fixed non-JSON response from SwissLipids
  (<https://github.com/aws/graph-explorer/pull/395>)
- Improved monorepo configuration
  (<https://github.com/aws/graph-explorer/pull/305>)
- Updated database query abstractions
  (<https://github.com/aws/graph-explorer/pull/366>)
  (<https://github.com/aws/graph-explorer/pull/367>)
  (<https://github.com/aws/graph-explorer/pull/365>)
- Improved the GitHub templates for issues and pull requests
  (<https://github.com/aws/graph-explorer/pull/281>)
  (<https://github.com/aws/graph-explorer/pull/332>)
  (<https://github.com/aws/graph-explorer/pull/362>)
- Various dependency upgrades (<https://github.com/aws/graph-explorer/pull/295>)
  (<https://github.com/aws/graph-explorer/pull/306>)
  (<https://github.com/aws/graph-explorer/pull/360>)

## Release 1.6.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Added support for Neptune Analytics
  (<https://github.com/aws/graph-explorer/pull/241>)
- Added auto-cancellation of previous queries on new SPARQL/Gremlin search
  (<https://github.com/aws/graph-explorer/pull/259>)
- Added search cancellation button
  (<https://github.com/aws/graph-explorer/pull/265>)
- Added additional PNPM checks to GitHub CI
  (<https://github.com/aws/graph-explorer/pull/268>)
- Improved keyword search performance
  (<https://github.com/aws/graph-explorer/pull/243>)
- Updated proxy URL generation in SageMaker Lifecycle
  (<https://github.com/aws/graph-explorer/pull/279>)
- Updated PropertyGraph Summary API routes in proxy server
  (<https://github.com/aws/graph-explorer/pull/250>)
- Updated SageMaker documentation for Neptune Analytics
  (<https://github.com/aws/graph-explorer/pull/282>)

**Bug Fixes and Minor Changes**

- Fixed escaping of quote characters in keyword search
  (<https://github.com/aws/graph-explorer/pull/242>)
- Fixed edge retrieval for legacy schema sync on openCypher
  (<https://github.com/aws/graph-explorer/pull/245>)
- Fixed default connections for Neptune Analytics
  (<https://github.com/aws/graph-explorer/pull/254>)
- Fixed formatting of search UI footer
  (<https://github.com/aws/graph-explorer/pull/260>)
- Fixed handling of query cancellation on unsupported databases
  (<https://github.com/aws/graph-explorer/pull/276>)
- Fixed rotation of sync progress indicator
  (<https://github.com/aws/graph-explorer/pull/278>)
- Additional config adjustments for ESLint and Prettier
  (<https://github.com/aws/graph-explorer/pull/255>)
- Removed `__all` predicate filter from SPARQL search queries
  (<https://github.com/aws/graph-explorer/pull/270>)
- Various formatting improvements
  (<https://github.com/aws/graph-explorer/pull/251>)
  (<https://github.com/aws/graph-explorer/pull/266>)
  (<https://github.com/aws/graph-explorer/pull/267>)
- Various dependency upgrades (<https://github.com/aws/graph-explorer/pull/248>)
  (<https://github.com/aws/graph-explorer/pull/246>)
  (<https://github.com/aws/graph-explorer/pull/286>)

## Release 1.5.1

This release includes the following feature enhancements and bug fixes:

**Bug fixes**

- Refactored API request options for non-IAM endpoints
  (<https://github.com/aws/graph-explorer/pull/230>)
- Enforced JSON response format for SPARQL queries
  (<https://github.com/aws/graph-explorer/pull/230>)
- Bumped `vite` to `4.5.2` (<https://github.com/aws/graph-explorer/pull/233>)

## Release 1.5.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Added new Fetch Timeout option to the Connections UI
  (<https://github.com/aws/graph-explorer/pull/199>)

**Bug fixes**

- Fixed synchronization with high number of labels with long strings
  (<https://github.com/aws/graph-explorer/pull/206>)
- Fixed loading spinner rotation when synchronizing schema
  (<https://github.com/aws/graph-explorer/pull/207>)
- Fixed node and edge counts not updating on connection re-synchronization
  (<https://github.com/aws/graph-explorer/pull/209>)
- Fixed issue with Transition2 findDOMNode deprecation
  (<https://github.com/aws/graph-explorer/pull/211>)
- Fixed highlight not persisting on selected graph element
  (<https://github.com/aws/graph-explorer/pull/187>)
- Bumped `@types/semver` to `7.5.2`
- Bumped `babel`, `postcss`, and `vite` to latest
- Bumped `crypto-js` to `4.2.0`
- Bumped `@adobe/css-tools` to `4.3.2`

## Release 1.4.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Added SageMaker Notebook support
  (<https://github.com/aws/graph-explorer/pull/178>)
- Added Default Connection support
  (<https://github.com/aws/graph-explorer/pull/108>)
- Added query language indicators to created connections
  (<https://github.com/aws/graph-explorer/pull/164>)
- Added match precision option to keyword search
  (<https://github.com/aws/graph-explorer/pull/175>)
- Added toggle for limit on retrieved vertex neighbors
  (<https://github.com/aws/graph-explorer/pull/176>)
- Added SageMaker Notebook hosting documentation
  (<https://github.com/aws/graph-explorer/pull/183>)
- Added ECS hosting documentation
  (<https://github.com/aws/graph-explorer/pull/174>)
- Updated Dockerfile base image to AL2022
  (<https://github.com/aws/graph-explorer/pull/190>)

**Bug fixes**

- Fixed search UI crashing on node select/preview
  (<https://github.com/aws/graph-explorer/pull/177>)
- Fixed Gremlin/openCypher matching ID property on all keyword searches
  (<https://github.com/aws/graph-explorer/pull/169>)
- Fixed default connections failing on SageMaker for certain instance names
  (<https://github.com/aws/graph-explorer/pull/188>)
- Resolved deprecation warnings in GitHub workflows
  (<https://github.com/aws/graph-explorer/pull/181>)
- Patched vulnerable dependencies
  ([1](https://github.com/aws/graph-explorer/pull/182))
  ([2](https://github.com/aws/graph-explorer/pull/189))
  ([3](https://github.com/aws/graph-explorer/pull/191))

## Release 1.3.1

This patch release includes bugfixes for Release 1.3.0.

**Bug fixes**

- Fix proxy issue with non-IAM Neptune requests
  (<https://github.com/aws/graph-explorer/pull/166>)

## Release 1.3.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Support openCypher-based graph databases
  (<https://github.com/aws/graph-explorer/pull/129>)
- Added ability to search by vertex ID for Gremlin
  (<https://github.com/aws/graph-explorer/pull/113>)
- Improved logging visibility and user control
  (<https://github.com/aws/graph-explorer/pull/114>)
- Upgraded various dependencies to resolve Docker build warnings
  (<https://github.com/aws/graph-explorer/pull/118>)
- Improved synchronization interface in Connections UI
  (<https://github.com/aws/graph-explorer/pull/120>)
- Added coverage tests for the UI client package
  (<https://github.com/aws/graph-explorer/pull/130>)

**Bug fixes**

- Fix Expand Module scrollbar (<https://github.com/aws/graph-explorer/pull/131>)
- Fixed header generation for IAM authenticated Neptune requests
  (<https://github.com/aws/graph-explorer/pull/140>)
- Fixed calculation of neighbors count in Expand View sidebar
  (<https://github.com/aws/graph-explorer/pull/121>)
- Fixed proxy server not respecting `GRAPH_EXP_ENV_ROOT_FOLDER` value in .env
  (<https://github.com/aws/graph-explorer/pull/125>)

## Release 1.2.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Significantly reduced size of Docker image
  (<https://github.com/aws/graph-explorer/pull/104>)
- Improved schema synchronization performance via Summary API integration
  (<https://github.com/aws/graph-explorer/pull/80>)
- Improved error messaging when no/insufficient IAM role is found
  (<https://github.com/aws/graph-explorer/pull/81>)
- Updated Connections UI documentation for single server changes
  (<https://github.com/aws/graph-explorer/pull/59>)
- Added manual trigger for ECR updates
  (<https://github.com/aws/graph-explorer/pull/68>)

**Bug fixes**

- Fixed incorrect display of non-string IDs for Gremlin
  (<https://github.com/aws/graph-explorer/pull/60>)
- Fixed a database synchronization error caused by white spaces in labels for
  Gremlin requests (<https://github.com/aws/graph-explorer/pull/84>)

## Release 1.1.0

This release includes the following feature enhancements and bug fixes:

**Features**

- Support for blank nodes when visualizing graphs using the RDF data model
  (<https://github.com/aws/graph-explorer/pull/48>)
- Enable Caching feature in the Connections UI which allows you to temporarily
  store data in the browser between sessions
  (<https://github.com/aws/graph-explorer/pull/48>)
- Simplify the setup by consolidating the build and serving the graph-explorer
  through port (<https://github.com/aws/graph-explorer/pull/52>)
- Moved self-signed SSL certificate creation to Docker entrypoint script
  (<https://github.com/aws/graph-explorer/pull/56>)

**Bug fixes**

- Fix an issue where the Graph Explorer is stuck in a loading state indefinitely
  due to expired credentials by refreshing credentials and retrying requests
  automatically (<https://github.com/aws/graph-explorer/pull/49>)

## Release 1.0.0

The first release of Graph Explorer, an Apache 2.0 React-based web application
that enables users to visualize both property graph and RDF data and explore
connections between data without having to write graph queries. Major features
include:

- Ability to connect to graph databases like Amazon Neptune, or open-source
  endpoints like Gremlin Server or Blazegraph
- Search and preview starting nodes once connected to a graph database
- Visualize results in the Graph View & expand to view neighbors
- Customize the Graph View with preferred layouts, colors, icons, labels, and
  more
- Use Expand filters to customize the result set by filter text or count of
  results when expanding
- Scroll through the Table View to view the data in the Graph View in tabular
  format
- Use Table View filters when you need to highlight a subset of the data
- Download a CSV or JSON of the nodes and edges in visualization, or download as
  a PNG file
