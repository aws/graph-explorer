# Browser Floor

Graph Explorer supports the browsers that are Baseline Widely available. `packages/graph-explorer/.browserslistrc` pins their minimum versions. Raise them on purpose, never silently through a dependency bump.

Three layers enforce the floor. Each one catches what the others miss:

- **Build**: `vite.config.ts` derives `build.target` from `.browserslistrc` through `buildTarget.ts`. Vite lowers syntax to that target, but it never polyfills a missing API.
- **Types**: browser packages set `lib: ES2023`, so `tsc` rejects ES2024 and later built-ins, including instance methods such as Iterator helpers and `Set.prototype.union`.
- **Lint**: in `.oxlintrc.json`, production code in `packages/graph-explorer/src` and `packages/shared/src` runs `baseline-js/use-baseline` with `available: "widely"`, along with a few `es-x` syntax rules. Tests are excluded because they run in Node.

## What the lint covers

- `baseline-js` flags static built-ins (`Error.isError`, `Promise.try`) and Web APIs that aren't Widely available. Its data comes bundled with the plugin version, so upgrading the plugin can move what it allows.
- The `es-x` rules flag syntax the other two layers let through: `using` declarations, RegExp duplicate named groups and modifiers, import attributes, and JSON modules.
- `ignoreFeatures` skips two features:
  - `html-wrapper-methods`, which flags any `.bold` or `.anchor` property.
  - `top-level-await`, which web-features lists as Safari 27 even though the floor's Safari already runs it and Vite builds it for the floor.

## What nothing catches

- Instance methods on DOM types, such as `element.checkVisibility()`. Under oxlint, `baseline-js` has no type information, and `lib`'s `DOM` isn't versioned.
- ES2023 features outside the floor, such as symbols as `WeakMap` keys (Firefox 146).

Check these by hand in review. A justified `oxlint-disable-next-line baseline-js/use-baseline -- <reason>` is fine when the code feature-detects the API, when the lint misreads a feature that is Widely available, or when the gap is one browser version and the feature reaches Widely available within weeks.
