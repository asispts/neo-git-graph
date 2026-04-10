import { describe, expect, it } from "vitest";

import { escapeHtml, unescapeHtml } from "@/webview/utils/html";

describe("escapeHtml", () => {
  // 1. Passthrough — safe content is not mangled
  it("returns an empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns plain ASCII text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("returns a numeric string unchanged", () => {
    expect(escapeHtml("42")).toBe("42");
  });

  it("returns unicode and emoji unchanged", () => {
    expect(escapeHtml("héllo 🌍")).toBe("héllo 🌍");
  });

  // 2. No raw HTML-breaking characters survive in the output
  it("produces no literal < in the output", () => {
    expect(escapeHtml("a < b")).not.toMatch(/</);
  });

  it("produces no literal > in the output", () => {
    expect(escapeHtml("a > b")).not.toMatch(/>/);
  });

  it("produces no bare & in the output", () => {
    // A bare & is one not immediately followed by #, alphanumerics, and ;
    expect(escapeHtml("a & b")).not.toMatch(/&(?![#a-zA-Z0-9]+;)/);
  });

  // 3. Attribute context — cannot break out of a quoted attribute value
  it("produces no literal double-quote in the output", () => {
    expect(escapeHtml('" onmouseover="evil')).not.toMatch(/"/);
  });

  it("produces no literal single-quote in the output", () => {
    expect(escapeHtml("' onmouseover='evil")).not.toMatch(/'/);
  });

  // 4. Tag injection — cannot form executable markup
  it("neutralises a script-tag XSS payload", () => {
    const result = escapeHtml("<script>alert(1)</script>");
    expect(result).not.toMatch(/</);
    expect(result).not.toMatch(/>/);
  });

  it("neutralises a self-closing img XSS payload", () => {
    const result = escapeHtml("<img src=x onerror=alert(1)/>");
    expect(result).not.toMatch(/</);
    expect(result).not.toMatch(/>/);
  });

  // 5. Round-trip consistency
  it("is lossless: unescapeHtml(escapeHtml(str)) === str", () => {
    const hazardous = `<>"'&/hello & <world> "test" 'value' end/`;
    expect(unescapeHtml(escapeHtml(hazardous))).toBe(hazardous);
  });

  // 6. Double-escaping — function is a raw escaper, not an HTML normaliser
  it("re-escapes the & in an already-escaped entity", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  // 7. Forward-slash escaping — closes inline script contexts
  it("escapes / to &#x2F;", () => {
    expect(escapeHtml("</script>")).toBe("&lt;&#x2F;script&gt;");
  });
});

describe("unescapeHtml", () => {
  // 1. Passthrough — content without entities is not mangled
  it("returns an empty string unchanged", () => {
    expect(unescapeHtml("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(unescapeHtml("hello world")).toBe("hello world");
  });

  // 2. Each known entity decodes correctly
  it("decodes &amp; to &", () => {
    expect(unescapeHtml("&amp;")).toBe("&");
  });

  it("decodes &lt; to <", () => {
    expect(unescapeHtml("&lt;")).toBe("<");
  });

  it("decodes &gt; to >", () => {
    expect(unescapeHtml("&gt;")).toBe(">");
  });

  it('decodes &quot; to "', () => {
    expect(unescapeHtml("&quot;")).toBe('"');
  });

  it("decodes &#x27; to '", () => {
    expect(unescapeHtml("&#x27;")).toBe("'");
  });

  it("decodes &#x2F; to /", () => {
    expect(unescapeHtml("&#x2F;")).toBe("/");
  });

  // 3. Single-level only — does not double-decode
  it("decodes &amp;amp; to &amp;, not &", () => {
    expect(unescapeHtml("&amp;amp;")).toBe("&amp;");
  });

  // 4. Unknown entities pass through unchanged
  it("leaves unknown entities like &nbsp; unchanged", () => {
    expect(unescapeHtml("&nbsp;")).toBe("&nbsp;");
  });

  // 5. Malformed entities (no trailing ;) pass through unchanged
  it("leaves malformed &amp without semicolon unchanged", () => {
    expect(unescapeHtml("&amp")).toBe("&amp");
  });
});
