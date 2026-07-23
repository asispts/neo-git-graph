let dateFormatterCache: Intl.DateTimeFormat | null = null;
function getDateFormatter(locale: string): Intl.DateTimeFormat {
  if (!dateFormatterCache) {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
    try {
      dateFormatterCache = new Intl.DateTimeFormat(locale, options);
    } catch {
      // Invalid locale tag — fall back to the runtime's default locale
      dateFormatterCache = new Intl.DateTimeFormat(undefined, options);
    }
  }
  return dateFormatterCache;
}

/** Format the date portion of a commit date using the VS Code display language. */
export function formatShortDate(date: Date, locale: string): string {
  return getDateFormatter(locale).format(date);
}

export function pad2(i: number) {
  return i > 9 ? i : "0" + i;
}
