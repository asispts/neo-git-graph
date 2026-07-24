import { describe, expect, it } from "vitest";

import { formatRelativeDate } from "@/webview/utils/date";

/** `seconds` in the past, relative to a fixed "now". */
const NOW = new Date("2026-07-24T12:00:00Z");
function ago(seconds: number, locale = "en") {
  return formatRelativeDate(new Date(NOW.getTime() - seconds * 1000), NOW, locale);
}

describe("formatRelativeDate", () => {
  // 1. Unit selection — the largest unit that fits is used
  it("uses seconds below a minute", () => {
    expect(ago(5)).toBe("5 seconds ago");
  });

  it("uses minutes below an hour", () => {
    expect(ago(90)).toBe("2 minutes ago");
  });

  it("uses hours below a day", () => {
    expect(ago(3600)).toBe("1 hour ago");
  });

  it("uses days below a week", () => {
    expect(ago(86400)).toBe("1 day ago");
  });

  it("uses weeks below a month", () => {
    expect(ago(604800)).toBe("1 week ago");
  });

  it("uses months below a year", () => {
    expect(ago(2629800 * 3)).toBe("3 months ago");
  });

  it("uses years above a year", () => {
    expect(ago(31557600 * 2)).toBe("2 years ago");
  });

  // 2. Pluralization comes from the locale, not from string concatenation
  it("uses the singular form for exactly one unit", () => {
    expect(ago(1)).toBe("1 second ago");
  });

  it("uses the plural form for more than one unit", () => {
    expect(ago(2)).toBe("2 seconds ago");
  });

  // 3. Word order is locale-specific — zh-cn suffixes rather than prefixes
  it("places the zh-cn relative marker after the unit", () => {
    expect(ago(90, "zh-cn")).toBe("2分钟前");
  });

  // 4. Clock skew — a commit dated in the future reads as future, not negative
  it("formats a future date as upcoming", () => {
    expect(ago(-30)).toBe("in 30 seconds");
  });

  // 5. An unusable locale tag falls back instead of throwing
  it("does not throw on an invalid locale tag", () => {
    expect(() => ago(5, "not a locale")).not.toThrow();
  });
});
