let getMonthCache: string[] | null = null;
export function getMonth(): string[] {
  if (getMonthCache) return getMonthCache;
  getMonthCache = [
    l10n.monthJan,
    l10n.monthFeb,
    l10n.monthMar,
    l10n.monthApr,
    l10n.monthMay,
    l10n.monthJun,
    l10n.monthJul,
    l10n.monthAug,
    l10n.monthSep,
    l10n.monthOct,
    l10n.monthNov,
    l10n.monthDec
  ];
  return getMonthCache;
}
export function pad2(i: number) {
  return i > 9 ? i : "0" + i;
}
