# 漢字学習サイト 設計・実装計画書（v0.1）

最終更新: 2026-11-17
もとにした仕様書: [spec.md](./spec.md)（ドラフト v0.1）
問題データ: [../public/data/questions.json](../public/data/questions.json)（第49〜54回、129問）

この文書は、仕様書をどう作るかを決めるものです。**ファイル構成、モジュール構成、リファクタの進め方、全体の作業順序**をまとめます。コードはまだ書きません。

この計画で新しく決めたこと（仕様書には書いていない選択）には **【計画で選択】** と付けています。変えたい場合はその箇所を直してください。

---

## 1. 設計の方針

1. **画面とロジックを分ける。** 復習の計算、統計の集計、JSONの統合、出題の選び方などは、画面（Svelte）にもブラウザの保存先にも依存しない「純粋なTypeScript」として書く。こうするとテストが書きやすく、あとで画面を作り直してもロジックはそのまま使える。
2. **保存するのは生データだけ。** 解答記録 `attempts` と回の記録 `sessions` だけを保存し、統計・復習リスト・苦手な漢字は毎回そこから計算する（仕様書 5.1、6.4）。集計結果のキャッシュは、遅くなったときに初めて考える。
3. **依存の向きを一方通行にする。** 「画面 → 状態管理 → ロジック」「保存 → ロジックの型」の向きだけを許し、ロジックから画面や保存を呼ばない（第4章）。
4. **小さく作って、毎段階で動くものを本番URLに出す。** 各フェーズの終わりに `kanji.taitan.uk` で実際にiPadで触って確認する（第6章）。
5. **リファクタは「振る舞いを変えない変更」として別に行う。** 機能追加と混ぜない（第5章）。

---

## 2. 技術の選択

仕様書で決まっているもの: Vite＋Svelte、Tailwind CSS、flake.nix（flake-parts、treefmt、pre-commit フック）、Cloudflare Pages＋Pages Functions、非公開GitHubリポジトリ。

その上で、次のものを選びます。

| 項目 | 選択 | 理由 |
| --- | --- | --- |
| 言語 | TypeScript（strict） | データ形式（解答記録、バックアップJSON）の取り違えを型で防ぐ 【計画で選択】 |
| Svelte | Svelte 5（runes: `$state` / `$derived`） | 現行の版。状態を `.svelte.ts` ファイルに切り出せる 【計画で選択】 |
| 画面の切り替え | 自前の小さなハッシュルーター（`#/quiz` など） | 画面は8つだけで、ルーターのライブラリは不要。ハッシュ方式なら Pages の設定もいらない 【計画で選択】 |
| Tailwind | Tailwind CSS v4（`@tailwindcss/vite`） | 設定ファイルがほぼ不要。`portrait:` / `landscape:` も標準で使える 【計画で選択】 |
| IndexedDB | `idb`（小さな薄いラッパー） | 生のIndexedDB APIはコールバックが多く書きにくいため 【計画で選択】 |
| PWA | `vite-plugin-pwa`（Workbox） | マニフェストとService Workerを自動生成できる 【計画で選択】 |
| 単体テスト | Vitest ＋ `fake-indexeddb` | Viteと設定を共有できる。IndexedDBもNode上で試せる 【計画で選択】 |
| 画面のテスト | Playwright（手元とCIで実行） | 出題〜採点の一連の流れを自動で確認する 【計画で選択】 |
| 型チェック | `svelte-check` | `.svelte` ファイルの型も見る |
| 整形 | Prettier（`prettier-plugin-svelte`、`prettier-plugin-tailwindcss`）、Nixは nixfmt | Biome は Svelte 対応がまだ部分的なため Prettier にする 【計画で選択】 |
| 静的チェック | ESLint（`eslint-plugin-svelte`） | 依存の向きのルール（第4.3）もここで機械的に守る 【計画で選択】 |
| パッケージ管理 | npm | Cloudflare のビルド環境でそのまま `npm ci && npm run build` が通る 【計画で選択】 |
| Node.js | 22 LTS（`.nvmrc` と flake で同じ版にそろえる） | Cloudflare のビルド環境と手元を一致させる 【計画で選択】 |

---

## 3. ファイル構成

```
kanji-study/                      ← 非公開GitHubリポジトリ
├── flake.nix                     ← flake-parts。devShell、treefmt、pre-commit
├── flake.lock
├── .nvmrc                        ← Node.js の版（Cloudflareのビルド用）
├── package.json
├── package-lock.json
├── vite.config.ts                ← Svelte、Tailwind、PWA プラグイン
├── svelte.config.js
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── wrangler.toml                 ← Pages の設定（出力先、互換性日付）
├── index.html
├── README.md                     ← 開発の始め方、デプロイ、パスワードの変え方
│
├── docs/
│   ├── spec.md                   ← 仕様書（このプロジェクトの kanji-study-spec.md を移す）
│   ├── design-plan.md            ← この文書
│   ├── decisions/                ← 設計の決定の記録（ADR。1件1ファイル）
│   └── tech-debt.md              ← あとで直すことの一覧（第5.4）
│
├── public/
│   ├── data/
│   │   └── questions.json        ← 問題データ（ログインで守る。実行時に取得）
│   ├── icons/                    ← PWA のアイコン（192px、512px、apple-touch-icon）
│   └── robots.txt                ← 全部拒否
│
├── functions/                    ← Cloudflare Pages Functions（ログイン）
│   ├── _middleware.ts            ← 全リクエストの Cookie を確認、なければ /login へ
│   ├── login.ts                  ← GET: ログイン画面のHTML / POST: 照合して Cookie を発行
│   ├── logout.ts                 ← Cookie を消して /login へ
│   └── lib/
│       ├── session-cookie.ts     ← 署名付きCookieの作成と検証（HMAC-SHA256）
│       └── login-page.ts         ← ログイン画面のHTML文字列（SPAとは独立）
│
├── scripts/
│   └── validate-questions.ts     ← 問題データの検査（ビルド前とCIで実行）
│
├── src/
│   ├── main.ts                   ← 起動。App.svelte を表示し、Service Worker を登録
│   ├── app.css                   ← Tailwind の読み込みと共通の色・文字の大きさ
│   │
│   ├── domain/                   ← 純粋なロジック（画面・保存先に依存しない）
│   │   ├── types.ts              ← Question、Attempt、Session、Grade などの型
│   │   ├── questions.ts          ← 問題データの読み込みと検査、ID（"49-1"）の作成・分解
│   │   ├── furu.ts               ← 例文を「前・太字・後」の3つに分ける
│   │   ├── range.ts              ← 出題範囲（始まり〜終わり、回の選択、足し合わせ）
│   │   ├── picker.ts             ← 範囲からランダムに選んで並べる（乱数は外から渡す）
│   │   ├── quiz-session.ts       ← 1回の出題の状態遷移（解答中 → 採点中 → 確定）
│   │   ├── review.ts             ← 解答記録から復習リストと連続正解を計算
│   │   ├── stats.ts              ← 漢字ごと・回ごと・全体の集計、苦手な漢字
│   │   ├── backup.ts             ← バックアップJSONの作成、検査、統合（id で重複除去）
│   │   ├── backup-migrations.ts  ← schemaVersion の変換
│   │   └── config.ts             ← 調整できる値の初期値（卒業3回、警告7日など）
│   │
│   ├── handwriting/              ← 手書き（キャンバスのエンジン部分）
│   │   ├── strokes.ts            ← ストロークと操作（ペン、消しゴム、全部消す）のデータ、1つ戻す
│   │   ├── renderer.ts           ← ストロークを canvas に描く（大きさに合わせて拡大縮小）
│   │   ├── input.ts              ← Pointer Events を受け、ペンのみ設定や誤操作防止を処理
│   │   └── HandwritingCanvas.svelte  ← 上の3つをまとめた部品
│   │
│   ├── storage/                  ← ブラウザの保存先（IndexedDB と localStorage）
│   │   ├── db.ts                 ← IndexedDB を開く、ストアの定義、版の更新
│   │   ├── attempts-repo.ts      ← 解答記録・回の記録の読み書き
│   │   ├── drafts-repo.ts        ← 未完了の回（手書き・採点途中）の読み書き
│   │   ├── settings.ts           ← 設定（ペンの太さ、ペンのみ、最後の出題範囲など）
│   │   ├── meta.ts               ← 最後に書き出した日時など
│   │   └── persist.ts            ← navigator.storage.persist() の依頼と状態の確認
│   │
│   ├── state/                    ← 画面と保存・ロジックをつなぐ状態（Svelte の runes）
│   │   ├── questions.svelte.ts   ← 問題データの取得と保持
│   │   ├── history.svelte.ts     ← 解答記録の保持と、統計・復習の派生値
│   │   ├── active-quiz.svelte.ts ← 今の出題の状態と、手書きの自動保存
│   │   └── router.svelte.ts      ← ハッシュルーター
│   │
│   ├── screens/                  ← 画面（1画面1フォルダー）
│   │   ├── home/HomeScreen.svelte
│   │   ├── setup/SetupScreen.svelte、RangePicker.svelte
│   │   ├── answer/AnswerScreen.svelte、ToolBar.svelte
│   │   ├── grading/GradingScreen.svelte、GradingCard.svelte
│   │   ├── result/ResultScreen.svelte
│   │   ├── stats/StatsScreen.svelte、KanjiTable.svelte、WeakList.svelte
│   │   └── settings/SettingsScreen.svelte、ImportDialog.svelte、ClearDialog.svelte
│   │
│   ├── components/               ← 画面をまたいで使う小さな部品
│   │   ├── FuruText.svelte       ← 例文（yomi を太字）
│   │   ├── Button.svelte、Dialog.svelte、Banner.svelte
│   │   └── layout/               ← 縦横で並びを変える枠（2列・3列・縦積み）
│   │
│   └── App.svelte                ← ルーターで画面を切り替える。起動時の再開確認
│
├── tests/
│   ├── unit/                     ← domain、handwriting/strokes、storage の単体テスト
│   ├── fixtures/                 ← テスト用の小さな問題データ、バックアップJSON
│   └── e2e/                      ← Playwright（iPad・スマホの画面サイズで実行）
│
└── .github/
    └── workflows/
        └── ci.yml                ← 整形確認、ESLint、型チェック、単体テスト、ビルド、E2E
```

### 3.1 構成についての補足

- **問題データは `public/data/questions.json` に置き、実行時に `fetch` する。** JavaScriptに埋め込まない理由は、問題を足したときにアプリ本体を作り直さずに済むことと、Service Worker で別にキャッシュの更新を管理しやすいことです。どちらの置き方でもミドルウェアで守られます。【計画で選択】
- **ログイン画面は SPA の外に置く。** ログイン前はアプリ本体のJavaScriptも守られていて読み込めないため、`functions/lib/login-page.ts` が小さなHTMLを直接返します。
- **仕様書と計画書はリポジトリの `docs/` に移す。** 実装が始まったら、コードと同じ場所で更新します。このプロジェクトのファイル置き場の版は、その時点で「リポジトリが正」とします。

---

## 4. モジュール構成

### 4.1 層の分け方

```
 screens / components   （見た目と操作）
          │
          ▼
        state            （画面の状態、保存の呼び出し）
       │      │
       ▼      ▼
   storage   handwriting
       │      │
       ▼      ▼
        domain           （純粋なロジックと型）
```

`functions/`（ログイン）はブラウザ側のコードと完全に独立していて、お互いに読み込みません。

### 4.2 各モジュールの責任と境界

#### domain（純粋なロジック）

DOM、IndexedDB、localStorage、`Date.now()`、`Math.random()` を直接使いません。時刻や乱数は引数で受け取ります。こうすると、テストで結果を固定できます。

| モジュール | 責任 | 入力 → 出力の例 | 持たないもの |
| --- | --- | --- | --- |
| `types.ts` | 全体で使うデータの型 | `Question`、`Attempt`、`Session`、`QuestionId = "49-1"` 形式 | ロジック |
| `questions.ts` | 問題データを読み、検査し、平らな一覧にする | 生JSON → `Question[]`（ID付き）／エラー一覧 | 取得（fetch）処理 |
| `furu.ts` | 例文を太字の位置で分ける | `("ガッコウへ通う。", "ガッコウ")` → `{before:"", bold:"ガッコウ", after:"へ通う。"}` | 表示 |
| `range.ts` | 出題範囲の表現と、範囲に入る問題の計算 | 範囲の組み合わせ → `QuestionId[]`（重複なし） | 画面の選択UI |
| `picker.ts` | ランダムに選んで並べる。復習時の優先順位付け | `(候補, 問題数, 乱数)` → 出題順の `QuestionId[]` | 乱数の生成 |
| `quiz-session.ts` | 1回の出題の状態遷移 | `start → answer(i) → grade(i, ○×) → confirm()` → 確定した `Attempt[]` と `Session` | 手書きのデータ本体、保存 |
| `review.ts` | 復習リストの計算（仕様書 6.1） | `Attempt[]` → `Map<QuestionId, {streak, wrongCount}>`（卒業した問題は含まない） | 保存された状態 |
| `stats.ts` | 漢字ごと・回ごと・全体の集計、苦手な漢字 | `(Attempt[], Question[], 設定)` → 集計結果 | 表やグラフの描画 |
| `backup.ts` | 書き出し用JSONの作成、読み込んだJSONの検査、統合 | `(今の記録, 読み込んだJSON)` → `{merged, added, duplicated}` | ファイルの保存・選択 |
| `backup-migrations.ts` | 古い `schemaVersion` を新しい形に変換 | v1 → v2 … | — |
| `config.ts` | 調整できる値の初期値（仕様書 12章） | 定数 | 利用者が変えた値（それは storage/settings） |

**`quiz-session.ts` の状態**:

```
 setup ──start──▶ answering ──finish──▶ grading ──confirm──▶ confirmed
                     ▲  │                  │
                     └──┘ 前へ/次へ         └─ ○×の付け直し
 （どの状態からも discard で破棄 → 統計に記録しない）
```

- `finish` は未記入の問題があれば、その番号を返す（確認は画面が出す）。
- `confirm` は全問に○×が付いているときだけ成功する。

#### handwriting（手書き）

| モジュール | 責任 | 境界 |
| --- | --- | --- |
| `strokes.ts` | 操作の列（`pen` / `eraser` / `clear`）を持ち、追加と「1つ戻す」を行う。座標はキャンバスの大きさに対する割合（0〜1） | DOMを使わない純粋なデータ。単体テストの対象 |
| `renderer.ts` | 操作の列を、指定の大きさの canvas に描き直す。消しゴムは `destination-out` で重ねる。端末の画素密度（`devicePixelRatio`）に合わせる | 入力は受けない。採点画面の小さな表示にも同じものを使う |
| `input.ts` | Pointer Events を受けて点を集め、1画ごとに `strokes` に渡す。「ペンのみ」設定のときは `pointerType === "pen"` 以外を無視。スクロール・拡大・長押しを止める | 保存はしない（画の終わりを知らせるだけ） |
| `HandwritingCanvas.svelte` | 上の3つを組み合わせた部品。大きさが変わったら描き直す | 道具ボタンは持たない（`ToolBar.svelte` が外から操作する） |

**キャンバスの縦横比は正方形に固定する。** 座標を割合で記録するため、縦長・横長が変わると字がゆがみます。正方形にしておけば、向きを変えても大きさが変わるだけで形は同じです。正方形を、空いている場所に収まる最大の大きさで置きます。【計画で選択】

#### storage（保存先）

| モジュール | 責任 |
| --- | --- |
| `db.ts` | IndexedDB の名前、版、ストアの定義。版を上げるときの変換もここに集める |
| `attempts-repo.ts` | `attempts`、`sessions` の追加・全件読み込み・一括追加（統合用）・全削除 |
| `drafts-repo.ts` | 未完了の回を1件だけ保存・読み込み・削除 |
| `settings.ts` | localStorage の設定。読めない・壊れているときは初期値に戻す |
| `meta.ts` | 最後にJSONを書き出した日時 |
| `persist.ts` | `navigator.storage.persist()` の依頼と、許可されたかの確認 |

**IndexedDB のストア** 【計画で選択】

| ストア | キー | 中身 |
| --- | --- | --- |
| `attempts` | `id`（UUID） | 仕様書 5.2 の解答記録。`questionId` と `answeredAt` に索引 |
| `sessions` | `id`（UUID） | 回の開始日時、モード、問題数、出題範囲 |
| `draft` | 固定キー `"current"` | 未完了の回: 出題順、今の番号、各問題の手書き操作の列、付けた○× |

- 手書きは「1画書き終わるごと」に、少し待ってから（0.5秒程度）まとめて `draft` に保存します。
- 採点の確定は、**1つのトランザクションで** `attempts` と `sessions` に追加し、`draft` を消します。途中で失敗しても「記録だけ残って手書きも残る」「記録が消える」といった中途半端な状態になりません。

#### state（状態）

画面から呼ばれる窓口です。保存先とロジックを組み合わせます。

| モジュール | 責任 |
| --- | --- |
| `questions.svelte.ts` | `questions.json` を取得して検査し、保持する。取得できないとき（オフライン初回など）の表示用の状態も持つ |
| `history.svelte.ts` | 解答記録を起動時に読み込んで保持し、`review` と `stats` の結果を派生値として出す。確定・統合・クリアのあとに更新 |
| `active-quiz.svelte.ts` | `quiz-session` の状態を持ち、手書きの自動保存と、起動時の再開・破棄を扱う |
| `router.svelte.ts` | `location.hash` と今の画面を対応させる |

#### screens / components（画面）

- 画面は state を呼ぶだけで、IndexedDB や計算の細かいところを知らない。
- 縦横で並びを変える処理は `components/layout/` の枠にまとめ、各画面に Tailwind の `portrait:` / `landscape:` を散らばらせない。
- キーボード操作（次の問題、1つ戻すなど）は解答画面と採点画面がそれぞれ登録し、画面を離れるときに外す。

#### functions（ログイン）

| ファイル | 責任 |
| --- | --- |
| `_middleware.ts` | `/login` 以外の全リクエストで Cookie を検証。無効なら、ページへのアクセスは `/login?next=…` へ転送、`/data/` などのデータ取得は 401 を返す |
| `login.ts` | GET: ログイン画面を返す。POST: `AUTH_USER` / `AUTH_PASSWORD` と照合（長さに依存しない比較）。合えば Cookie を発行して元のページへ |
| `logout.ts` | Cookie を消す |
| `lib/session-cookie.ts` | Cookie の中身は「発行日時＋有効期限」に `AUTH_SECRET` でHMAC署名したもの。`HttpOnly; Secure; SameSite=Lax; Max-Age=1年` |

- 環境変数（Cloudflare のシークレット）: `AUTH_USER`、`AUTH_PASSWORD`、`AUTH_SECRET`。`AUTH_SECRET` を変えると、全端末のログインが一度に無効になります（端末をなくしたときの対策）。【計画で選択】
- 間違ったパスワードには1秒ほど待ってから返す（総当たり対策の簡単なもの）。

#### PWA と Service Worker

- `vite-plugin-pwa` でアプリ本体（HTML、JS、CSS、アイコン）を事前にキャッシュする。
- `questions.json` は「まずネット、だめならキャッシュ」の方式でキャッシュし、問題の追加がすぐ反映されるようにする。【計画で選択】
- **`/login` と `/logout` はキャッシュしない**（`navigateFallbackDenylist` に入れる）。ログイン画面への転送の応答をキャッシュしてしまうと、オフラインで開けなくなるためです。
- 新しい版が出たら、出題中は更新せず、ホーム画面に「更新があります」と出して押したら再読み込みする。【計画で選択】

### 4.3 境界の守り方

- ESLint の `no-restricted-imports` で、`domain/` から `storage/`・`state/`・`screens/`・`svelte` を読み込めないようにする。`storage/` から `screens/` も同様。
- `domain/` と `handwriting/strokes.ts` は単体テストで網羅率 90% 以上を目安にする（画面は E2E で確認）。

---

## 5. リファクタの計画と進め方

### 5.1 基本のルール

1. **リファクタは振る舞いを変えない。** 先にテストがあること、リファクタ前後でテストが全部通ることを条件にする。
2. **機能追加とリファクタを同じコミット・同じPRに混ぜない。** コミットの頭に `refactor:` を付ける。差分を見たときに「何も変わっていないはず」と確認しやすくするため。
3. **各フェーズの最後に「リファクタ枠」を取る。** 機能が一段落した時点で、そのフェーズで増えたコードを見直してから次へ進む（第6章の各フェーズの最後の項目）。
4. **気づいたことはすぐ直さずに `docs/tech-debt.md` に書く。** 今の作業を止めずに済み、リファクタ枠でまとめて判断できる。

### 5.2 リファクタを始める目安

次のどれかに当てはまったら、リファクタ枠の対象にします。

| 目安 | 例 |
| --- | --- |
| 同じ処理が3か所に出てきた | 問題IDの分解、日付の表示、○×の色付け |
| 1ファイルが300行を超えた、または画面の部品に計算が入り込んだ | `GradingScreen.svelte` の中で正答率を計算している |
| 依存の向きのルールに例外を作りたくなった | ロジックから設定を直接読みたくなった → 引数で渡す形に直す |
| テストが書きにくい | 時刻や乱数を直接使っている → 引数にする |
| 名前が仕様書の言葉とずれた | 仕様書が「回」なのにコードが `round` と `session` で混ざる |

### 5.3 あらかじめ予定しているリファクタ

作りながら見直すことが分かっているものです。

| 時期 | 内容 | 理由 |
| --- | --- | --- |
| フェーズ3の終わり | キャンバスの描画を「全部描き直す」から「確定済みの画を別の層に描いておく」形にするか判断 | 画数が多い字でiPadの書き味が重い場合のみ。計測してから決める |
| フェーズ4の終わり | 解答画面・採点画面・結果画面で共通の部品（例文、問題番号、移動ボタン）を `components/` に切り出す | 3画面がそろってから共通部分を決める方が、早すぎる共通化を避けられる |
| フェーズ5の終わり | 統計・復習の計算が遅ければ、確定ごとに差分で更新する形を検討 | 生データから毎回計算する方針（1.2）のままで十分速いかを、解答記録 1万件のテストデータで測る |
| フェーズ6の終わり | 保存の失敗（容量不足、Safari のプライベートモード）の扱いを1か所にまとめる | 書き出し・読み込み・クリアで失敗の扱いが増えるため |
| フェーズ8の終わり | 縦横の並びの枠（`layout/`）の見直し | 実機の確認で直したところを整理する |

### 5.4 tech-debt.md の書き方

```
- [ ] 2026-12-01 GradingCard と AnswerScreen で例文の表示が重複（目安: 3か所目で直す）
- [ ] 2026-12-03 drafts-repo の保存間隔が固定値（設定にする？）
- [x] 2026-12-05 問題IDの分解を questions.ts に集約（refactor PR #12）
```

### 5.5 データ形式を変えるとき

保存しているデータの形を変えるのは、ふつうのリファクタより影響が大きいので、別の手順にします。

- IndexedDB の形を変える: `db.ts` の版を上げ、古い版からの変換を書き、変換のテストを足す。
- バックアップJSONの形を変える: `schemaVersion` を上げ、`backup-migrations.ts` に変換を足す。古い版のサンプルファイルを `tests/fixtures/` に残し、いつでも読み込めることをテストで確認する。
- 問題データ: IDは変えない（仕様書 9.3）。`scripts/validate-questions.ts` でIDの重複と、`yomi` が `furu` にちょうど1回出ることを検査する（今のデータ129問はすべて条件を満たしていることを確認済み）。

---

## 6. 全体の進め方（フェーズ）

各フェーズは1〜数個のPRに分けます。PRごとに Cloudflare Pages のプレビューURLができる（ログインもかかる）ので、マージ前にiPadで確認できます。

### フェーズ0: 開発環境とリポジトリ

作業:
- 非公開リポジトリを作り、`flake.nix`（flake-parts、devShell に Node.js 22・wrangler、treefmt-nix、git-hooks.nix）を用意する
- Vite＋Svelte＋TypeScript＋Tailwind の最小の画面（「準備中」と出るだけ）
- ESLint、Prettier、svelte-check、Vitest、Playwright の設定
- GitHub Actions（整形確認、ESLint、型チェック、テスト、ビルド）
- Cloudflare Pages とリポジトリを連携、`kanji.taitan.uk` を設定

確認すること:
- `nix develop` で開発環境に入れ、`npm run dev` で開ける
- Nixなしの環境（CI）で `npm ci && npm run build` が通る
- コミット時に pre-commit で整形が走る
- `kanji.taitan.uk` で「準備中」が表示される

### フェーズ1: ログイン

**問題データを公開する前に、ログインを先に入れます。**

作業:
- `functions/` の3つと Cookie の署名・検証
- Cloudflare にシークレット（`AUTH_USER`、`AUTH_PASSWORD`、`AUTH_SECRET`）を設定
- その後、`public/data/questions.json` を追加

確認すること:
- ログインしていないと、どのページも `/login` に転送される（`curl` で確認）
- `/data/questions.json` もログインなしでは取れない（401）
- `*.pages.dev` とPRのプレビューURLにもログインがかかる
- Cookie を書き換えると無効になる
- iPhone・iPad で、ホーム画面に追加した状態でもログインが保たれる
- `functions/lib/session-cookie.ts` の単体テスト

### フェーズ2: ロジックの中心（画面なし）

作業: `domain/` を全部、テストと一緒に作る。`scripts/validate-questions.ts`。

確認すること（単体テスト）:
- 問題データ129問が読み込め、IDが `"49-1"` 形式になる
- 出題範囲: 「第49回5番〜第51回10番」「第49回＋第52回」とその足し合わせが正しい問題を返す
- ランダム選択: 同じ乱数の種なら同じ結果、問題数が範囲を超えたら範囲の数まで
- 復習: 仕様書 6.1 の7つのルールをそれぞれテストにする（×で入る、3回連続で卒業、途中の×で0に戻る、卒業後の×で再び入るなど）
- 統計: 正答率、苦手な漢字の並び（2回以上、同率なら間違いの多い順）
- 統合: 同じファイルを2回読んでも増えない、新しい `schemaVersion` は拒否、`format` 違いは拒否
- 出題の状態遷移: 全問○×が付くまで確定できない

リファクタ枠: 名前を仕様書の言葉とそろえる、型の整理。

### フェーズ3: 手書きキャンバス

作業: `handwriting/` と、試し書き用の仮の画面。

確認すること:
- iPad＋Apple Pencil で、遅れなく線が書ける（実機で確認）
- 「ペンのみ」オンで、手のひらや指が反応しない
- キャンバス上でスクロール・拡大・長押しメニューが起きない
- ペン、消しゴム、全部消す、1つ戻す（全部消すも戻せる）
- 向きを変えても字が残り、形がゆがまない
- PCでマウスで書ける
- `strokes.ts` の単体テスト

リファクタ枠: 描画の速さを計測し、5.3 の判断をする。

### フェーズ4: 出題から採点までの流れ

作業: 出題設定、解答、自己採点、結果の4画面。`storage/` の `attempts-repo`・`drafts-repo`・`settings`。`state/active-quiz`。

確認すること:
- 範囲と問題数を選んで出題 → 手書き → ○× → 確定、が通る（E2E）
- 解答中にページを再読み込みしても、手書きと位置が残る。起動時に「再開 / 破棄」が出る
- 確定すると手書きのデータが消え、解答記録が増える
- 未記入の問題があると確認が出る
- 「間違えた問題だけもう一度」で×の問題だけの回が始まる
- 最後に使った出題範囲が次回の初期値になる

リファクタ枠: 画面間の共通部品の切り出し（5.3）。

### フェーズ5: ホーム、復習、統計

作業: ホーム画面（復習件数と内訳）、「復習する」、統計画面（漢字ごと・回ごと・全体・苦手な漢字）、苦手な漢字だけの出題。

確認すること:
- 実際に何回か解いた記録で、復習件数と内訳（連続正解 0/1/2）が正しい
- 3回続けて○にすると復習リストから消える
- 統計の数字が手計算と一致する
- 解答記録1万件のテストデータで、画面の表示が十分速い（目安: 0.2秒以内）

リファクタ枠: 計算の速さによって 5.3 の判断。

### フェーズ6: データ管理

作業: JSONの書き出し（iPadの共有シート）、読み込み（件数の確認つき統合）、統計データのクリア（書き出しの案内 →「クリア」と入力 → 削除）、`persist()` の状態表示、バックアップ警告。

確認すること:
- iPadで書き出したファイルを「ファイル」アプリに保存し、PCで読み込んで統合できる
- 同じファイルを2回読んでも件数が増えない
- クリア後、設定と問題データは残り、統計と復習が空になる
- 書き出してから7日たつとホームに警告が出る（日時を変えたテスト）

リファクタ枠: 保存の失敗の扱いをまとめる（5.3）。

### フェーズ7: PWA とオフライン

作業: マニフェスト、アイコン、Service Worker、「ホーム画面に追加」の案内、更新の案内。

確認すること:
- iPad・iPhone でホーム画面に追加でき、全画面で開く
- 機内モードで、出題・採点・統計が使える
- 問題データを更新すると、次にネットにつないだときに反映される
- 出題中に新しい版が出ても、出題が中断されない

### フェーズ8: 画面の仕上げと実機確認

作業: 縦横・端末ごとの並び（仕様書 3.4 の表）の仕上げ、ボタンの大きさ（44px以上）、キーボード操作、文字の大きさ。

確認すること（実機の確認表）:

| 端末 | 縦 | 横 |
| --- | --- | --- |
| iPad（Safari、ホーム画面から） | 解答・採点・統計 | 解答・採点・統計 |
| iPhone（Safari、ホーム画面から） | 解答・採点・統計 | 解答・採点・統計 |
| PC（Chrome / Safari） | — | 解答・採点・統計、キーボード操作 |

- Playwright でも、iPad・iPhone の画面サイズの縦横で画面写真を撮って見比べる

リファクタ枠: `layout/` の整理（5.3）。

### フェーズ9: 公開と運用

作業: README（開発の始め方、パスワードの変え方、問題の足し方）、`docs/` の最新化、版のタグ（`v1.0.0`）。

確認すること:
- 本番URLで、ログイン → 出題 → 採点 → 統計 → 書き出し まで通しで使える
- 問題を足す手順（`questions.json` を直す → 検査が通る → push → 反映）が README のとおりにできる

### 6.1 作業の順序の理由

- **ログインを先に（フェーズ1）**: 問題データを公開URLに出す前に守るため。
- **ロジックを画面より先に（フェーズ2）**: 復習と統合はこのアプリで一番間違えやすい部分なので、テストで固めてから画面をつなぐ。
- **手書きを単独で（フェーズ3）**: iPadでの書き味は実機でしか分からず、一番手戻りが大きい。早めに確かめる。
- **PWA を後半に（フェーズ7）**: Service Worker のキャッシュは開発中の更新を分かりにくくするため、機能がそろってから入れる。ただし Safari の7日ルールがあるので、実際に使い始める前には必ず入れる。

### 6.2 ブランチとコミットの決まり 【計画で選択】

- `main` へのpushで本番にデプロイ。作業は `feat/…`、`fix/…`、`refactor/…` のブランチで行い、PRでマージする。
- コミットメッセージは `feat:`、`fix:`、`refactor:`、`test:`、`docs:`、`chore:` で始める。
- CI が全部通らないとマージしない（GitHubのブランチ保護）。

### 6.3 一夜漬けに間に合わせるための最小版

テストが近く、早く使いたい場合は、**フェーズ0〜4 だけで「使える最小版」**になります（ログイン、出題、手書き、採点、記録）。復習・統計・PWA はそのあとに足せます。ただし PWA がないと Safari の7日ルールで記録が消えることがあるので、最小版の期間は毎回JSONを書き出す（フェーズ6の書き出しだけ先に入れる）ことを勧めます。

---

## 7. 仕様書との食い違い（直したほうがよい点）

計画を作る中で気づいた、仕様書の小さな食い違いです。実装前に仕様書を直すことを提案します。

| 箇所 | 内容 | 直し方の案 |
| --- | --- | --- |
| 2章 ホーム画面 | 「復習待ちの件数（今日が期限のもの / 全部）」とあるが、6章で日付を使わない復習に決めたため「期限」がない | 「復習リストの件数と内訳（連続正解 0/1/2）」に直す（6.3と同じ） |
| 7.3 JSONの例 | `"questionId": "q-0123"` となっているが、9.3 で問題IDは `"49-1"` 形式に決まった | 例を `"49-1"` に直す |

---

## 8. この計画で選んだことの一覧

変えたいものがあれば教えてください。

1. TypeScript（strict）、Svelte 5 の runes、自前のハッシュルーター
2. Tailwind CSS v4、Prettier（Biome ではなく）、ESLint で依存の向きを強制
3. IndexedDB は `idb`、PWA は `vite-plugin-pwa`、テストは Vitest＋Playwright、パッケージ管理は npm
4. 問題データは `public/` に置いて実行時に取得（JSに埋め込まない）
5. キャンバスは正方形に固定（向きを変えても字がゆがまない）
6. Cookie の署名用に `AUTH_SECRET` を足す（変えると全端末が一度ログアウト）
7. 問題データのキャッシュは「まずネット」、アプリの更新は出題中は待つ
8. フェーズの順序（ログインを最初、PWA は後半）、最小版はフェーズ0〜4
