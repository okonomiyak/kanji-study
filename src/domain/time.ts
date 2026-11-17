/** 時差つきのISO 8601（例: 2026-11-17T13:45:00+09:00） */
export function toLocalIso(date: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`
  );
}

/** "YYYY-MM-DD"（その端末の日付） */
export function localDate(date: Date): string {
  return toLocalIso(date).slice(0, 10);
}

/** a から b までの日数（小数切り捨て） */
export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}
