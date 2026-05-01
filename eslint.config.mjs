import oxlint from "eslint-plugin-oxlint";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  // Ignore everything except graph-explorer frontend
  {
    ignores: [
      "**/*.config.{js,ts,mjs}",
      "**/vitest.workspace.ts",
      "**/dist/",
      "packages/graph-explorer-proxy-server/**",
      "packages/shared/**",
    ],
  },

  // TypeScript parser for all files
  tseslint.configs.base,

  // React Compiler rules (for graph-explorer only)
  {
    files: ["packages/graph-explorer/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      // Disable rules that oxlint handles natively
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },

  // Disable all ESLint rules that oxlint already covers
  ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
];
