import js from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import gitignore from "eslint-config-flat-gitignore";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// TypeScript files not referenced in any tsconfig.json.
// Type-aware linting is disabled for these files to avoid parser errors.
const orphanTsFiles = ["*.config.ts", "develop/**/*.ts"];

export default defineConfig([
  gitignore(),
  { ignores: ["packages/site/src/gen/**/*"] },
  { settings: { react: { version: "detect" } } },
  {
    files: ["**/*.{mjs,js,ts,tsx}"],
    extends: [js.configs.recommended],
    rules: {
      "array-callback-return": "error",
      "no-await-in-loop": "error",
      "no-console": "error",
      "no-unassigned-vars": "error",
      "default-case-last": "error",
      "dot-notation": "error",
      eqeqeq: ["error", "always", { null: "never" }],
      "no-array-constructor": "error",
      "no-else-return": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
      "prefer-object-spread": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: orphanTsFiles,
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          allowDefaultCaseForExhaustiveSwitch: false,
          requireDefaultForNonUnion: true,
        },
      ],

      "@typescript-eslint/no-misused-promises": [
        "error",
        // For ergonomic reasons when using React:
        // https://github.com/typescript-eslint/typescript-eslint/issues/4619
        { checksVoidReturn: { attributes: false } },
      ],

      // Some third-party libraries expect functions to return Promises. Without
      // `async`, we'd need to explicitly return `Promise.resolve()`, which isn't
      // quite the same thing (e.g., error handling behavior differs).
      // https://github.com/eslint/eslint/discussions/18271#discussioncomment-9016475
      "@typescript-eslint/require-await": "off",

      // Too many false positives
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: { regex: "^I[A-Z]", match: false },
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["function", "method"],
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["parameter", "memberLike"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
        { selector: "property", format: null },
        {
          format: ["camelCase"],
          selector: "variable",
          modifiers: ["destructured"],
          types: ["boolean"],
        },
        {
          format: ["PascalCase"],
          prefix: ["is", "should", "has", "can", "did", "will", "was"],
          selector: ["variable", "parameter"],
          types: ["boolean"],
        },
      ],
    },
  },
  {
    files: orphanTsFiles,
    extends: [tseslint.configs.recommended],
  },
  {
    files: ["packages/**/*.{ts,tsx}"],
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
      reactHooks.configs["recommended-latest"],
    ],
    rules: {
      "react/destructuring-assignment": "error",
      "react/jsx-boolean-value": "error",
      "react/jsx-handler-names": "error",
      "react/jsx-no-useless-fragment": "error",
    },
  },
  {
    files: ["packages/**/*.test.{ts,tsx}"],
    extends: [vitest.configs.recommended],
    rules: {
      "vitest/consistent-test-it": "error",
      "vitest/consistent-vitest-vi": "error",
      "vitest/no-focused-tests": "error",
      "vitest/no-identical-title": "error",
      "vitest/no-import-node-test": "error",
      "vitest/prefer-spy-on": "error",

      // Relaxed rules for tests
      "unicorn/no-useless-undefined": "off",
    },
  },
]);
