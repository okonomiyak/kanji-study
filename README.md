# kanji

漢字の書き取りを手書きで練習するための個人用Webサイト（https://kanji.taitan.uk ）。

- 仕様書: [docs/spec.md](docs/spec.md)
- 設計・実装計画書: [docs/design-plan.md](docs/design-plan.md)
- あとで直すこと: [docs/tech-debt.md](docs/tech-debt.md)

## 開発の始め方

```sh
nix develop      # Node.js 22、wrangler、treefmt が入り、pre-commit フックが入る
npm ci
npm run dev      # http://localhost:5173
```

Nix を使わない場合は Node.js 22 を入れて `npm ci` から始めます（Cloudflare のビルドも Nix なしです）。
`flake.lock` は最初に `nix develop` を実行したときに作られるので、コミットしてください。

| コマンド                         | 内容                                   |
| -------------------------------- | -------------------------------------- |
| `npm run build`                  | 本番用のビルド（`dist/`）              |
| `npm test`                       | 単体テスト（Vitest）                   |
| `npm run test:e2e`               | 画面のテスト（Playwright）             |
| `npm run lint` / `npm run check` | ESLint / 型チェック                    |
| `npm run format`                 | Prettier で整形                        |
| `nix fmt`                        | treefmt で全体を整形（Nix ファイルも） |
