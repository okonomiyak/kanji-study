import type { Env } from "./lib/env";
import { clearCookieHeader } from "./lib/session-cookie";

export const onRequest: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 303,
    headers: {
      Location: "/login",
      "Set-Cookie": clearCookieHeader(),
      "Cache-Control": "no-store",
    },
  });
