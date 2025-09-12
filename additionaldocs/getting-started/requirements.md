# Requirements

This guide outlines the system requirements and minimum recommended versions for
Graph Explorer and supported graph databases.

## Minimum Recommended Versions

Graph Explorer does not block any particular versions of graph databases, but
the queries used may or may not succeed based on the version of the query
engine.

For Neptune databases, we recommend
[version 1.2.1.0](https://docs.aws.amazon.com/neptune/latest/userguide/engine-releases-1.2.1.0.html)
or above, which include the summary API and TinkerPop 3.6.2.

For non-Neptune databases, we recommend at least TinkerPop 3.6.
