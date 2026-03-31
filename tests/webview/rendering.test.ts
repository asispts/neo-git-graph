import { beforeAll, describe, expect, it, vi } from "vitest";

import type * as GG from "@/types";

import { createVscodeMock, receive, setupHtml } from "./setup";

const REPO = "/workspace/my-repo";

const defaultViewState: GG.GitGraphViewState = {
  autoCenterCommitDetailsView: true,
  dateFormat: "Date & Time",
  fetchAvatars: false,
  graphColours: ["#0085d9"],
  graphStyle: "rounded",
  initialLoadCommits: 300,
  lastActiveRepo: null,
  loadMoreCommits: 75,
  repos: { [REPO]: { columnWidths: null } },
  showCurrentBranchByDefault: false
};

const twoCommits: GG.GitCommitNode[] = [
  {
    hash: "abc123",
    parentHashes: ["def456"],
    author: "Alice",
    email: "alice@example.com",
    date: 1700000000,
    message: "Add feature",
    refs: [{ hash: "abc123", name: "main", type: "head" }]
  },
  {
    hash: "def456",
    parentHashes: [],
    author: "Bob",
    email: "bob@example.com",
    date: 1699000000,
    message: "Initial commit",
    refs: []
  }
];

describe("webview rendering", () => {
  beforeAll(async () => {
    vi.resetModules();
    createVscodeMock();
    setupHtml(defaultViewState);
    await import("../../src/webview/main");
    receive({
      command: "loadBranches",
      branches: ["main"],
      head: "main",
      hard: true,
      isRepo: true
    });
    receive({
      command: "loadCommits",
      commits: twoCommits,
      head: "abc123",
      moreCommitsAvailable: true,
      hard: true
    });
  });

  it("shows Load More Commits button when more commits are available", () => {
    expect(document.getElementById("loadMoreCommitsBtn")).not.toBeNull();
  });
});
