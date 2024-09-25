import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

const overrides = [
  {
    files: ["*.ts", "*.tsx"],
    rules: {
      "react/prop-types": "off"
    }
  }
];

export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], overrides},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];