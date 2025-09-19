import globals from "globals";
import pluginJs from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactLint from "eslint-plugin-react";
import * as reactHooks from "eslint-plugin-react-hooks";
import tanstackQueryLint from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import { fixupPluginRules, includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default defineConfig(
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
  reactHooks.configs.recommended,
  {
    extends: [
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
  },
  {
    plugins: {
      "@tanstack/query": fixupPluginRules(tanstackQueryLint),
    },
    rules: {
      ...tanstackQueryLint.configs.recommended.rules,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: [
            "packages/graph-explorer/tsconfig.app.json",
            "packages/graph-explorer-proxy-server/tsconfig.json",
            "packages/shared/tsconfig.json",
          ],
        },
      },
    },
  },
  eslintConfigPrettier,
  // General rules
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],

      // Import sorting with eslint-plugin-import
      "import/order": "error",

      // TypeScript
      "@typescript-eslint/switch-exhaustiveness-check": "error",
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
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: false, // Set to false to allow import of queryClient type in packages/graph-explorer/src/setupTests.ts
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
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
      "react-hooks/react-compiler": "error",

      // TanStack Query
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/no-rest-destructuring": "warn",
      "@tanstack/query/stable-query-client": "error",
    },
  }
);
