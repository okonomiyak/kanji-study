/** 正答率（0〜1）を「75%」のように表す */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
