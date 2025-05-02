import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import reactLint from "eslint-plugin-react";
import reactHooksLint from "eslint-plugin-react-hooks";
import tanstackQueryLint from "@tanstack/eslint-plugin-query";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintConfigPrettier from "eslint-config-prettier";
import { fixupPluginRules, includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default tseslint.config(
  // Ignored files
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "**/tailwind.config.ts",
      "**/eslint.config.mjs",
      "**/vitest.config.ts",
      "**/vitest.workspace.ts",
      "**/*.config.js",
    ],
  },
  // Settings
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { settings: { react: { version: "18" } } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Plugins
  pluginJs.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  reactLint.configs.flat.recommended,
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
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
  eslintConfigPrettier,
  // General rules
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],

      // TypeScript
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
      "react/jsx-curly-brace-presence": "error",

      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // TanStack Query
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/no-rest-destructuring": "warn",
      "@tanstack/query/stable-query-client": "error",
    },
  }
);
