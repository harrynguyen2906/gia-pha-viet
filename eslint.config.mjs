/**
 * Root ESLint flat config — applies to ALL packages in the monorepo.
 * Each app can extend this in its own eslint.config.mjs.
 *
 * Covers:
 *   - TypeScript strict checking via @typescript-eslint
 *   - Prettier integration (disables formatting rules that conflict)
 *   - Common best-practice rules
 */
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // ── Global ignores ──────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/build/**",
      "**/dist/**",
      "**/out/**",
      "**/src/generated/**",   // Prisma generated client
      "**/prisma/seed.ts",     // Seed scripts — not part of app
      "**/*.config.{js,mjs,ts,cjs}", // Config files
    ],
  },

  // ── TypeScript source files ──────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // ── TypeScript strict rules ──────────────────────
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],

      // ── General best practices ───────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
    },
  },

  // ── Prettier conflict prevention (inline) ─────────────
  {
    rules: {
      // Disable rules that Prettier handles
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
];
