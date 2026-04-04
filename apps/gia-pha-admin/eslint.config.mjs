/**
 * gia-pha-admin ESLint config
 * Extends root monorepo config + adds Next.js specific rules.
 */
import rootConfig from "../../eslint.config.mjs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  // Root monorepo rules (TypeScript + Prettier)
  ...rootConfig,

  // Next.js specific rules
  ...nextVitals,
  ...nextTs,

  // App-level ignores
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
