module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "google",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/node_modules/**/*",
    ".eslintrc.js",
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "quotes": ["warn", "double"],
    "import/no-unresolved": 0,
    "indent": ["warn", 2],
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    "max-len": ["warn", { code: 120 }],
    "object-curly-spacing": ["warn", "always"],
  },
};
