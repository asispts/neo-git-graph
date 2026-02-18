import { describe, expect, it } from "vitest";

import { escapeHtml, unescapeHtml } from "../../web/utils";

/**
 * Black-box tests for the HTML escaping feature.
 *
 * The contract: escapeHtml must neutralise every character that has special
 * meaning in HTML, and unescapeHtml must be its exact inverse.
 */
describe("escapeHtml", () => {
  it("escapes each HTML special character individually", () => {
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#x27;");
    expect(escapeHtml("/")).toBe("&#x2F;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
    expect(escapeHtml("abc123")).toBe("abc123");
    expect(escapeHtml("")).toBe("");
  });

  it("escapes all special characters present in a mixed string", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
    );
  });

  it("round-trips through unescapeHtml back to the original string", () => {
    const original = "<div class=\"panel\">Hello & 'world'</div>";
    expect(unescapeHtml(escapeHtml(original))).toBe(original);
  });
});
