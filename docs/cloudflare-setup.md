# Cloudflare Pages の設定手順（本人が行う作業）

## 1. Pages プロジェクトを作る

1. Cloudflare のダッシュボード → **Workers & Pages** → **作成** → **Pages** → **Git に接続**
2. GitHub の `taitan291/kanji` を選ぶ（非公開リポジトリなので、Cloudflare の GitHub アプリにこのリポジトリへのアクセスを許可する）
3. ビルドの設定:
   - フレームワーク プリセット: なし
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `dist`
   - 本番ブランチ: `main`
   - 環境変数 `NODE_VERSION` = `22`（`.nvmrc` があれば不要）

## 2. ログイン用のシークレットを設定する

**設定** → **変数とシークレット** で、**本番とプレビューの両方**に次の3つを「暗号化（シークレット）」で追加します。

| 名前 | 値 |
| --- | --- |
| `AUTH_USER` | ログインのユーザー名 |
| `AUTH_PASSWORD` | ログインのパスワード（長めのもの） |
| `AUTH_SECRET` | Cookie 署名用のランダムな文字列。例: `openssl rand -base64 32` の出力 |

- 3つのどれかが無いと、誰もログインできません（安全側に倒しています）。
- 追加・変更したあとは、**デプロイをやり直す**と反映されます（**デプロイ** → 最新のもの → **再試行**）。
- パスワードを変えたいとき: `AUTH_PASSWORD` を変えて再デプロイ。
- 全端末のログインを一度に無効にしたいとき（端末をなくしたときなど）: `AUTH_SECRET` を変えて再デプロイ。

## 3. 独自ドメイン `kanji.taitan.uk`

1. Pages プロジェクト → **カスタムドメイン** → **カスタムドメインを設定** → `kanji.taitan.uk`
2. `taitan.uk` の DNS が Cloudflare にあれば、CNAME は自動で作られます。

## 4. 確認

- `https://kanji.taitan.uk/` を開くとログイン画面に転送される
- `https://kanji.taitan.uk/data/questions.json` をログインなしで開くと 401
- `*.pages.dev` の URL と、PR ごとのプレビュー URL でもログインが出る
