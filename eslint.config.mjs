import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import reactHooksLint from "eslint-plugin-react-hooks";
import tanstackQueryLint from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier";
import {
  fixupConfigRules,
  fixupPluginRules,
  includeIgnoreFile,
} from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["packages/graph-explorer-proxy-server/*"],
  },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...fixupConfigRules(pluginReactConfig),
  {
    plugins: { "react-hooks": fixupPluginRules(reactHooksLint) },
    rules: { ...reactHooksLint.configs.recommended.rules },
  },
  {
    plugins: {
      "@tanstack/query": fixupPluginRules(tanstackQueryLint),
    },
    rules: {
      ...tanstackQueryLint.configs.recommended.rules,
    },
  },
  eslintConfigPrettier,
  // General rules
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],

      // TypeScript
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // React rules
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",

      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": [
        "error",
        {
          additionalHooks: "(useRecoilCallback|useRecoilTransaction_UNSTABLE)",
        },
      ],

      // TanStack Query
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/no-rest-destructuring": "warn",
      "@tanstack/query/stable-query-client": "error",
    },
    settings: { react: { version: "18" } },
  },
];
