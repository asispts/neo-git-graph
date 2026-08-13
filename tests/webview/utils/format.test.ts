import { h } from "preact";
import { describe, expect, it } from "vitest";

import { format } from "@/webview/utils/format";

describe("format", () => {
  it("returns the template when it holds no placeholder", () => {
    expect(format("Refresh")).toEqual(["Refresh"]);
  });

  it("injects a part in place of its placeholder", () => {
    expect(format("Add tag to commit {0}", "abcd1234")).toEqual(["Add tag to commit ", "abcd1234"]);
  });

  it("injects a node without turning it into text", () => {
    const node = h("b", null, "abcd1234");

    expect(format("Checkout {0}?", node)).toEqual(["Checkout ", node, "?"]);
  });

  it("fills every placeholder by its own index", () => {
    expect(format("merge {0} into {1}?", "topic", "main")).toEqual([
      "merge ",
      "topic",
      " into ",
      "main",
      "?"
    ]);
  });

  it("keeps the order of the parts, not the order of the placeholders", () => {
    expect(format("{1} then {0}", "second", "first")).toEqual(["first", " then ", "second"]);
  });

  it("drops a placeholder that has no part", () => {
    expect(format("reset {0} to {1}", "main")).toEqual(["reset ", "main", " to ", undefined]);
  });
});
