import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "node_modules", ".wrangler", "handoff", "scripts", "public"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.serviceworker },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", varsIgnorePattern: "^([A-Z]|_|motion$)" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      // constants.js has known duplicate category keys (last one wins).
      "no-dupe-keys": "warn",
    },
  },
  {
    files: ["cloudflare-worker.js", "vite.config.js", "eslint.config.js", "vitest.config.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.serviceworker, ...globals.node } },
    rules: { "no-empty": ["error", { allowEmptyCatch: true }] },
  },
  {
    files: ["**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
