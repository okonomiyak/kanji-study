/** 問題データの検査（設計計画書 5.5）。ビルド前とCIで実行する。 */
import { readFileSync } from "node:fs";
import { parseQuestions } from "../src/domain/questions.ts";

const path = process.argv[2] ?? "public/data/questions.json";
let raw: unknown;
try {
  raw = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`${path} を JSON として読めません: ${(e as Error).message}`);
  process.exit(1);
}
const { questions, errors } = parseQuestions(raw);
if (errors.length > 0) {
  console.error(`${path}: ${errors.length} 件のエラー`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`${path}: ${questions.length} 問 OK`);
