// ESLint configuration for the entire project
import reactPlugin from "eslint-plugin-react";

export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    ignores: ["node_modules/**", "build/**", "dist/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-duplicate-imports": "error",
      "no-console": "warn",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off"
    },
  },
];
