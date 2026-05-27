[← Features](./)

# Settings

## General Settings

- **Default Neighbor Expansion Limit:** This setting will allow you to enable or disable the default limit applied during neighbor expansion. This applies to both double click expansion and the expand sidebar. This setting can be overridden by a similar setting on the connection itself.
- **Save Configuration:** This action will export all the configuration data within the Graph Explorer local database. This will not store any data from the connected graph databases. However, the export may contain the shape of the schema for your databases and the connection URL.
- **Load Configuration:** This action will replace all the Graph Explorer configuration data you currently have with the data in the provided configuration file. This is a destructive act and can not be undone. It is **strongly** suggested that you perform a **Save Configuration** action before performing a **Load Configuration** action to preserve any existing configuration data.
- **Export Styling:** Exports the current node and edge styling as a pretty-printed JSON file (`graph-explorer-styling.json`). The file uses symbolic icon references like `"iconUrl": "lucide:plane"` so it's human-readable and version-controllable, and round-trips cleanly through Import. Share it with teammates or check it into a repo.
- **Import Styling:** Loads a styling JSON file and applies it. Imported values replace your current styling and become the new baseline for **Reset to Default** behavior. The file format accepts both an `iconUrl` field (full reference like `"lucide:plane"`, a `data:` URI, or a plain URL) and an `icon` shorthand (e.g., `"icon": "user"`) which is converted to `"lucide:user"` on import.
- **Reset All Styling:** Resets every node and edge style. If a styling file has been imported in the current session, all types are restored to those imported values. Otherwise, styling reverts to the application's hardcoded defaults.

## About

In the _About_ page you can see the version number and submit any feedback.
