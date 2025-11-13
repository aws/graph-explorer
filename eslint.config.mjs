import { defineConfig } from "eslint/config";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import reactLint from "eslint-plugin-react";
import * as reactHooks from "eslint-plugin-react-hooks";
import tanstackQueryLint from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier";
import { fixupPluginRules, includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig(
  // Ignored files
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  {
    ignores: ["**/*.config.{js,ts,mjs}", "**/vitest.workspace.ts"],
  },

  // JavaScript files
  pluginJs.configs.recommended,
  tseslint.configs.recommendedTypeChecked,

  // TypeScript files - all packages
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Disallow use of console.log
      "no-console": ["error", { allow: ["warn", "error"] }],

      // Force all switches to be exhaustive
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      // Ensure imports are marked with type when appropriate
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],

      // Allow unused vars with modifier
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Ensure no type imports contain side effects
      "@typescript-eslint/no-import-type-side-effects": "error",

      // Disable overly strict rules (we should eliminate these over time)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },

  // React files - frontend only
  {
    files: ["packages/graph-explorer/**/*.{ts,tsx}"],
    plugins: {
      react: reactLint,
      "react-hooks": fixupPluginRules(reactHooks),
      "@tanstack/query": fixupPluginRules(tanstackQueryLint),
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: "19" },
    },
    rules: {
      ...reactLint.configs.flat.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...tanstackQueryLint.configs.recommended.rules,

      // React optimizations
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/jsx-curly-brace-presence": "error",

      // TanStack Query
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/no-rest-destructuring": "warn",
      "@tanstack/query/stable-query-client": "error",
    },
  },

  // Node.js backend files
  {
    files: ["packages/graph-explorer-proxy-server/**/*.{ts,js}"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Prettier must be last
  eslintConfigPrettier
);
