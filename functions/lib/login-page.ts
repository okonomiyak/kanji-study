function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** ログイン画面のHTML（SPAの外。ログイン前はアプリのJSも読めないため）。 */
export function loginPage(options: { next: string; error?: string }): string {
  const error = options.error
    ? `<p class="error" role="alert">${escapeHtml(options.error)}</p>`
    : "";
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>ログイン - 漢字の書き取り</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #fafaf9; color: #1c1917; padding: 16px;
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", system-ui, sans-serif; }
  form { width: 100%; max-width: 360px; background: #fff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 24px; }
  h1 { font-size: 1.25rem; margin: 0 0 16px; }
  label { display: block; font-size: .9rem; margin: 12px 0 4px; }
  input { width: 100%; font-size: 1.1rem; padding: 10px 12px; border: 1px solid #d6d3d1; border-radius: 10px; }
  button { margin-top: 20px; width: 100%; min-height: 48px; font-size: 1.1rem; border: 0; border-radius: 10px;
    background: #1c1917; color: #fff; }
  .error { color: #b91c1c; margin: 0 0 8px; }
</style>
</head>
<body>
<form method="post" action="/login">
  <h1>漢字の書き取り</h1>
  ${error}
  <input type="hidden" name="next" value="${escapeHtml(options.next)}">
  <label for="u">ユーザー名</label>
  <input id="u" name="username" autocomplete="username" autocapitalize="off" required>
  <label for="p">パスワード</label>
  <input id="p" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">ログイン</button>
</form>
</body>
</html>`;
}
