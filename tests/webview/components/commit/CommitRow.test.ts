// @vitest-environment jsdom

import { h, render } from "preact";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import type { GitCommitNode } from "@/backend/types";
import type { WebviewConfig } from "@/types";
import { initializeWebviewConfig } from "@/webview/lib/webview-config";

let CommitRow: typeof import("@/webview/components/commit/CommitRow").CommitRow;
let container: HTMLTableSectionElement;

beforeAll(async () => {
  const config: WebviewConfig = {
    autoCenterCommitDetailsView: true,
    dateFormat: "Date & Time",
    fetchAvatars: false,
    graphColours: [],
    graphStyle: "rounded",
    initialLoadCommits: 300,
    loadMoreCommits: 100,
    locale: "en",
    showCurrentBranchByDefault: false
  };
  initializeWebviewConfig(config);
  ({ CommitRow } = await import("@/webview/components/commit/CommitRow"));
});

afterEach(() => {
  render(null, container);
});

describe("CommitRow", () => {
  it("reserves description space and exposes truncated content", () => {
    const branch = "feature/a-very-long-branch-name";
    const message = "Commit message after the branch label";
    const commit: GitCommitNode = {
      hash: "abc123456789",
      parentHashes: [],
      author: "Author",
      email: "author@example.com",
      date: 0,
      message,
      refs: [{ hash: "abc123456789", name: branch, type: "head" }]
    };
    container = document.createElement("tbody");

    render(
      h(CommitRow, {
        commit,
        isHead: false,
        headBranch: null,
        messages: new Map(),
        colour: undefined,
        expanded: false,
        onSelect: undefined
      }),
      container
    );

    const description = container.querySelector("td:nth-child(2)");
    const refRegion = description?.querySelector(":scope > div > span:first-child");
    const messageRegion = description?.querySelector(":scope > div > span:last-child");

    expect(refRegion?.classList.contains("max-w-1/2")).toBe(true);
    expect(refRegion?.querySelector("[title]")?.getAttribute("title")).toBe(branch);
    expect(messageRegion?.classList.contains("flex-1")).toBe(true);
    expect(messageRegion?.getAttribute("title")).toBe(message);
    expect(messageRegion?.textContent).toBe(message);
  });
});
