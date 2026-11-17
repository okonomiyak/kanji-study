export interface FuruParts {
  before: string;
  bold: string;
  after: string;
}

/** 例文を「前・太字・後」に分ける（仕様書 9.1）。yomi が無ければ全体を before にする。 */
export function splitFuru(furu: string, yomi: string): FuruParts {
  const i = yomi ? furu.indexOf(yomi) : -1;
  if (i < 0) return { before: furu, bold: "", after: "" };
  return {
    before: furu.slice(0, i),
    bold: yomi,
    after: furu.slice(i + yomi.length),
  };
}
