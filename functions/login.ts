import { authConfigured, type Env } from "./lib/env";
import { loginPage } from "./lib/login-page";
import {
  createSessionValue,
  safeNext,
  sessionCookieHeader,
  timingSafeEqual,
} from "./lib/session-cookie";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  return new Response(loginPage({ next }), { headers: HTML_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/"));

  if (!authConfigured(env)) {
    return new Response(
      loginPage({ next, error: "サーバーの設定（環境変数）が足りません。" }),
      {
        status: 500,
        headers: HTML_HEADERS,
      },
    );
  }

  // 両方とも必ず比べる（片方だけで早く返さない）
  const userOk = timingSafeEqual(username, env.AUTH_USER);
  const passOk = timingSafeEqual(password, env.AUTH_PASSWORD);
  if (!(userOk && passOk)) {
    await new Promise((r) => setTimeout(r, 1000)); // 総当たり対策の簡単なもの
    return new Response(
      loginPage({ next, error: "ユーザー名かパスワードが違います。" }),
      {
        status: 401,
        headers: HTML_HEADERS,
      },
    );
  }

  const value = await createSessionValue(env.AUTH_SECRET, Date.now());
  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      "Set-Cookie": sessionCookieHeader(value),
      "Cache-Control": "no-store",
    },
  });
};
