import next from "eslint-config-next";

export default [
  ...next.configs.recommended,
  ...next.configs["core-web-vitals"].rules,
  {
    ignores: [".next/*", "dist/*"],
  },
];
