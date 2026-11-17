import { authConfigured, type Env } from "./lib/env";
import {
  COOKIE_NAME,
  readCookie,
  verifySessionValue,
} from "./lib/session-cookie";

const PUBLIC_PATHS = new Set(["/login", "/logout", "/robots.txt"]);

/** ページへのアクセスは /login へ転送、データなどの取得は 401（設計計画書 4.2）。 */
function isPageRequest(request: Request, pathname: string): boolean {
  if (pathname.startsWith("/data/")) return false;
  const accept = request.headers.get("Accept") ?? "";
  return (
    request.method === "GET" &&
    (accept.includes("text/html") || pathname === "/")
  );
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (PUBLIC_PATHS.has(url.pathname)) return context.next();

  const ok =
    authConfigured(env) &&
    (await verifySessionValue(
      env.AUTH_SECRET,
      readCookie(request.headers.get("Cookie"), COOKIE_NAME),
      Date.now(),
    ));

  if (ok) {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    if (url.pathname.startsWith("/data/"))
      headers.set("Cache-Control", "private, no-cache");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  if (isPageRequest(request, url.pathname)) {
    const next = encodeURIComponent(url.pathname + url.search);
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?next=${next}`, "Cache-Control": "no-store" },
    });
  }
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
