import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const TYPED = ["src/**/*.ts", "functions/**/*.ts", "scripts/**/*.ts"];

export default ts.config(
  { ignores: ["dist/", ".wrangler/", "node_modules/", "coverage/"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  // 型情報を使った静的解析（Promise の放置、any の取り扱いなど）
  ...ts.configs.recommendedTypeChecked.map((c) => ({ ...c, files: TYPED })),
  {
    files: TYPED,
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  // 依存の向き（設計計画書 4.3）
  {
    files: ["src/domain/**"],
    rules: restrict([
      {
        group: ["svelte", "svelte/*"],
        message: "domain は svelte に依存しない",
      },
      {
        group: [
          "**/storage/**",
          "**/state/**",
          "**/screens/**",
          "**/components/**",
          "**/handwriting/**",
        ],
        message: "domain から上の層を読み込まない",
      },
    ]),
  },
  {
    files: [
      "src/handwriting/strokes.ts",
      "src/handwriting/renderer.ts",
      "src/handwriting/input.ts",
    ],
    rules: restrict([
      {
        group: ["**/storage/**", "**/state/**", "**/screens/**"],
        message: "handwriting から上の層を読み込まない",
      },
    ]),
  },
  {
    files: ["src/storage/**"],
    rules: restrict([
      {
        group: ["**/state/**", "**/screens/**", "**/components/**"],
        message: "storage から上の層を読み込まない",
      },
    ]),
  },
  {
    files: ["src/state/**"],
    rules: restrict([
      {
        group: ["**/screens/**"],
        message: "state から screens を読み込まない",
      },
    ]),
  },
);
