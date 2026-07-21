[← Features](./)

# Settings

## General Settings

- **Default Neighbor Expansion Limit:** This setting will allow you to enable or disable the default limit applied during neighbor expansion. This applies to both double click expansion and the expand sidebar. This setting can be overridden by a similar setting on the connection itself.
- **Save Configuration:** This action will export all the configuration data within the Graph Explorer local database. This will not store any data from the connected graph databases. However, the export may contain the shape of the schema for your databases and the connection URL.
- **Load Configuration:** This action will replace all the Graph Explorer configuration data you currently have with the data in the provided configuration file. This is a destructive act and can not be undone. It is **strongly** suggested that you perform a **Save Configuration** action before performing a **Load Configuration** action to preserve any existing configuration data.

## Styles

The Styles settings page lets you manage your styling configuration: the colors, shapes, icons, and other visual properties applied to vertex and edge types in the graph view.

Each type's appearance comes from your styles when you've set them, falling back to the built-in defaults otherwise. You set a type's style by editing it in the style dialog or by loading a styling file.

### Save styles to share

Saves your current styles to `graph-explorer.styles.json`. Loading this file on another machine or browser reproduces your full visual configuration.

### Load styles

Load a styling file to apply a saved look to your graph. This is how you pick up styles someone shared with you, restore your own setup on another machine, or roll back to a look you saved earlier.

Loading opens a preview so you can see what each type looks like now next to what the file would change it to. Every change starts selected, so you can review the whole set at a glance and uncheck anything you'd rather keep. Choosing **Load N selected** applies just the ones you kept.

Only the types you select change. Anything not in the file stays as it is, and any type that already looks the way the file describes is left out of the preview, so you only ever review real changes.

### Reset your styles

Clears all your node and edge styles, returning every type to the defaults. This cannot be undone, so consider saving first.

## About

In the _About_ page you can see the version number and submit any feedback.
