/**
 * 署名付きのログインCookie（設計計画書 4.2 functions）。
 * 中身は "v1.<発行日時ms>.<有効期限ms>.<署名>"。署名は AUTH_SECRET による HMAC-SHA256。
 */

export const COOKIE_NAME = "kanji_session";
export const DEFAULT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(
    await crypto.subtle.sign("HMAC", key, encoder.encode(data)),
  );
}

/** 長さ以外の情報を漏らさない比較。長さが違う場合も最後まで比べる。 */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function createSessionValue(
  secret: string,
  nowMs: number,
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS,
): Promise<string> {
  const payload = `v1.${nowMs}.${nowMs + maxAgeSeconds * 1000}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifySessionValue(
  secret: string,
  value: string | undefined,
  nowMs: number,
): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const [, issued, expires, sig] = parts as [string, string, string, string];
  if (!/^\d+$/.test(issued) || !/^\d+$/.test(expires)) return false;
  const expected = await hmac(secret, `v1.${issued}.${expires}`);
  if (!timingSafeEqual(sig, expected)) return false;
  return Number(expires) > nowMs;
}

export function readCookie(
  header: string | null,
  name: string,
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

export function sessionCookieHeader(
  value: string,
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS,
): string {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** ログイン後の戻り先。外部サイトへ飛ばされないよう、同じサイト内のパスだけを許す。 */
export function safeNext(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  )
    return "/";
  if (next.startsWith("/login") || next.startsWith("/logout")) return "/";
  return next;
}
