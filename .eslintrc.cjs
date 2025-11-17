module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    browser: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020
  },
  plugins: ["@typescript-eslint", "react"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react/recommended"],
  settings: {
    react: {
      version: "detect"
    }
  },
  ignorePatterns: ["dist", "node_modules", "apps/front/src_backup_*"],
  rules: {
    "react/react-in-jsx-scope": "off"
  }
};
