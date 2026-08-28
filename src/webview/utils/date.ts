import { getWebviewConfig } from "@/webview/lib/webview-config";

/**
 * Build a formatter once per locale. Constructing an Intl formatter is costly
 * enough to be worth caching when rendering a column of hundreds of commits.
 * Invalid locale tags fall back to the runtime's default locale.
 */
function memoizeByLocale<T>(build: (locale: string | undefined) => T) {
  const cache = new Map<string, T>();
  return (locale: string): T => {
    let formatter = cache.get(locale);
    if (!formatter) {
      try {
        formatter = build(locale);
      } catch {
        formatter = build(undefined);
      }
      cache.set(locale, formatter);
    }
    return formatter;
  };
}

const getDateFormatter = memoizeByLocale(
  (locale) => new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" })
);

const getFullDateFormatter = memoizeByLocale(
  (locale) => new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "long" })
);

const getRelativeFormatter = memoizeByLocale(
  (locale) => new Intl.RelativeTimeFormat(locale, { numeric: "always" })
);

/** Largest unit that fits, paired with the number of seconds in it. */
const RELATIVE_UNITS: [threshold: number, unit: Intl.RelativeTimeFormatUnit, seconds: number][] = [
  [60, "second", 1],
  [3600, "minute", 60],
  [86400, "hour", 3600],
  [604800, "day", 86400],
  [2629800, "week", 604800],
  [31557600, "month", 2629800],
  [Infinity, "year", 31557600]
];

/**
 * Format a commit date as a relative time ("5 minutes ago") using the VS Code
 * display language. Intl supplies the locale's own plural rules and word order,
 * so no part of this string is localized by the extension itself.
 */
function formatRelativeDate(date: Date, now: Date, locale: string): string {
  const diff = Math.round((now.getTime() - date.getTime()) / 1000);
  const abs = Math.abs(diff);
  const [, unit, seconds] = RELATIVE_UNITS.find(([threshold]) => abs < threshold)!;
  // Negative = in the past, which is what RelativeTimeFormat expects.
  return getRelativeFormatter(locale).format(-Math.round(diff / seconds), unit);
}

function pad2(value: number): string {
  return value > 9 ? String(value) : "0" + value;
}

export type CommitDate = {
  /** Absolute date and time, always shown as the cell tooltip. */
  title: string;
  /** Cell text, in the format the user configured. */
  value: string;
};

/** Full date and time, as shown in the commit details view. */
export function getFullDate(seconds: number): string {
  return getFullDateFormatter(getWebviewConfig().locale).format(new Date(seconds * 1000));
}

export function getCommitDate(seconds: number): CommitDate {
  const { dateFormat, locale } = getWebviewConfig();
  const date = new Date(seconds * 1000);
  const dateStr = getDateFormatter(locale).format(date);
  const title = `${dateStr} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

  switch (dateFormat) {
    case "Date Only":
      return { title, value: dateStr };
    case "Relative":
      return { title, value: formatRelativeDate(date, new Date(), locale) };
    default:
      return { title, value: title };
  }
}
