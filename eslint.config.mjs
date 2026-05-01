import next from "eslint-config-next";
import nextCwv from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...next,
  ...nextCwv,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "out/**", ".tmp/**", "public/**"],
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
