module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ["eslint:recommended", "plugin:react-hooks/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        // Allow variables that start with uppercase (React components) or 'motion'
        varsIgnorePattern: "^(motion|_|(.*[A-Z].*))$",
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
