module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "node_modules"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    // Allow any type in some places to avoid over-engineering
    "@typescript-eslint/no-explicit-any": "warn",
    // Warn on unused vars but don't block builds
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // Enforce fast refresh compatibility
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    // Accessibility basics
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
