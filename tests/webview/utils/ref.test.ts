import { describe, expect, it } from "vitest";

import { hasInvalidRefChars } from "@/webview/utils/ref";

describe("hasInvalidRefChars", () => {
  it("accepts a plain branch name", () => {
    expect(hasInvalidRefChars("feature/login")).toBe(false);
  });

  it("gives the same answer for the same name twice", () => {
    expect(hasInvalidRefChars("main")).toBe(false);
    expect(hasInvalidRefChars("main")).toBe(false);
  });

  it.each([
    ["a space", "my branch"],
    ["a leading dash", "-branch"],
    ["a leading slash", "/branch"],
    ["two dots", "a..b"],
    ["two slashes", "a//b"],
    ["a slash and a dot", "a/.b"],
    ["a trailing dot", "branch."],
    ["a trailing slash", "branch/"],
    ["the .lock suffix", "branch.lock"],
    ["an at-brace", "branch@{1}"],
    ["a lone at sign", "@"],
    ["a tilde", "branch~1"],
    ["a caret", "branch^"],
    ["a colon", "branch:name"],
    ["a question mark", "branch?"],
    ["an asterisk", "branch*"],
    ["a bracket", "branch["],
    ["a backslash", "branch\\name"]
  ])("rejects %s", (_name, value) => {
    expect(hasInvalidRefChars(value)).toBe(true);
  });
});
