# Release Preparation

This guide covers the process for preparing and releasing new versions of Graph
Explorer.

## Preparation of a release

This repository is composed by 2 packages and a mono-repository structure
itself. Then, you need to take into account 3 different `package.json` files:

- `<root>/package.json` is intended to keep the dependencies for managing the
  repository. It has utilities like linter, code formatter, or git checks.
- `<root>/packages/graph-explorer/package.json` is the package file that
  describes the UI client package.
- `<root>/packages/graph-explorer-proxy-server/package.json` is the package file
  for the node server which is in charge of authentication and redirection of
  requests.

Each of these `package.json` files has an independent `version` property.
However, in this project we should keep them correlated. Therefore, when a new
release version is being prepared, the version number should be increased in all
3 files. Regarding the version number displayed in the user interface, it is
specifically extracted from the `<root>/packages/graph-explorer/package.json`.
file
