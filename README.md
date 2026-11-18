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

## ログイン（Cloudflare Pages Functions）

`functions/` のミドルウェアが、`/login` 以外の全ページと問題データを守ります。認証情報は環境変数（`AUTH_USER`、`AUTH_PASSWORD`、`AUTH_SECRET`）です。

手元でログインを含めて試すとき:

```sh
cp .dev.vars.example .dev.vars   # 値は手元用
npm run pages:dev                # http://localhost:8788
```

Cloudflare 側の設定は [docs/cloudflare-setup.md](docs/cloudflare-setup.md) を参照してください。

## 問題を足す・直す

問題データは教材をもとにしているため、このリポジトリには入れず、非公開リポジトリ `taitan291/kanji-study-dict` の `questions.json` に置いています。

1. `kanji-study-dict` の `questions.json` を編集する（形式は [docs/spec.md](docs/spec.md) の 9.2）。
   - 回の番号と問題番号（ID `"49-1"` など）は一度決めたら変えない。直すときは中身だけを直す。
   - `yomi` は `furu` の中にちょうど1回出てくるようにする。
2. 検査する: このリポジトリで `KANJI_DATA_DIR=../kanji-study-dict npm run fetch:data && npm run validate:questions`（ビルドでも自動で検査される）。
3. `kanji-study-dict` の `main` に push すると、その GitHub Actions が Cloudflare Pages の Deploy Hook を呼んでサイトを作り直す。アプリは次に開いたとき（ネットにつながっていれば）新しい問題を読み込む。

### 問題データの取り込み（`npm run fetch:data`）

`npm run dev` と `npm run build` の最初に自動で動き、`public/data/questions.json`（git には入らない）を用意します。

| 条件                                       | 使うデータ                                                        |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `KANJI_DATA_DIR` がある                    | そのフォルダー（手元の `kanji-study-dict`）の `questions.json`    |
| `KANJI_DATA_TAKEN` がある                  | GitHub から `kanji-study-dict` の `questions.json` を取得         |
| すでに `public/data/questions.json` がある | そのまま                                                          |
| どれもない                                 | 見本データ（`tests/fixtures/sample-questions.json`、自作の129問） |

テストと CI は見本データで動きます。Cloudflare Pages の本番ビルド（`main`）で本物が取れないときは、ビルドを失敗させます。

## パスワードを変える

Cloudflare の Pages プロジェクト → 設定 → 変数とシークレット で `AUTH_PASSWORD` を変えて再デプロイします。
全端末のログインを一度に無効にしたいときは `AUTH_SECRET` も変えます。詳しくは [docs/cloudflare-setup.md](docs/cloudflare-setup.md)。

## 使い方のメモ

- iPad / iPhone では Safari の「ホーム画面に追加」から開いて使う（7日間開かないと記録が消える Safari の仕組みを避けるため）。
- 記録はその端末のブラウザの中だけにある。設定画面からときどき JSON を書き出しておく（7日たつとホームに案内が出る）。
- キーボード: 解答画面は ←→ で移動、Ctrl/⌘+Z で1つ戻す、E でペン/消しゴム。採点画面は O / X（または 1 / 2）。

## 構成

設計・実装計画書の3章・4章のとおり、`src/` は次の層に分かれています（依存は上から下への一方通行。ESLint で確認）。

| フォルダー                | 役割                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `screens/`, `components/` | 画面                                                         |
| `state/`                  | 画面と保存・ロジックをつなぐ状態（Svelte の runes）          |
| `storage/`                | IndexedDB と localStorage                                    |
| `handwriting/`            | 手書きキャンバス                                             |
| `domain/`                 | 画面にも保存先にも依存しないロジック（復習、統計、統合など） |

`functions/` はログイン用の Cloudflare Pages Functions で、ブラウザ側のコードとは独立しています。
