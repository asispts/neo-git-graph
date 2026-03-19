import { beforeAll, describe, expect, it, vi } from "vitest";

import type * as GG from "../../src/types";
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

let vscodeMock: ReturnType<typeof createVscodeMock>;

describe("webview rendering", () => {
  const openAuthorDropdown = () => {
    const currentValue = document.querySelector("#authorSelect .dropdownCurrentValue") as HTMLElement;
    currentValue.click();
  };

  const getAuthorFilterInput = () =>
    document.querySelector("#authorSelect .dropdownFilterInput") as HTMLInputElement;

  const getAuthorOptions = () =>
    Array.from(document.querySelectorAll("#authorSelect .dropdownOption")).map(
      (option) => option.textContent
    );

  beforeAll(async () => {
    vi.resetModules();
    vscodeMock = createVscodeMock();
    setupHtml(defaultViewState);
    await import("../../web/main");
    receive({
      command: "loadBranches",
      branches: ["main"],
      head: "main",
      hard: true,
      isRepo: true
    });
    receive({
      command: "loadAuthors",
      authors: ["Alice", "Bob"],
      hard: true
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

  it("sends author filter with loadCommits requests", async () => {
    vscodeMock.clearMessages();

    openAuthorDropdown();

    const authorInput = getAuthorFilterInput();
    authorInput.value = "Alice";
    authorInput.dispatchEvent(new Event("input"));

    await new Promise((resolve) => setTimeout(resolve, 300));

    const loadCommits = vscodeMock.sentMessages.find(
      (msg): msg is GG.RequestLoadCommits => msg.command === "loadCommits"
    );
    expect(loadCommits?.author).toBe("Alice");
  });

  it("shows author suggestions newest-to-oldest without duplicates", () => {
    receive({
      command: "loadAuthors",
      authors: ["Zoe", "Alice", "Bob"],
      hard: true
    });
    receive({
      command: "loadCommits",
      commits: [
        {
          hash: "h1",
          parentHashes: ["h2"],
          author: "Zoe",
          email: "zoe@example.com",
          date: 1700000300,
          message: "Newest",
          refs: []
        },
        {
          hash: "h2",
          parentHashes: ["h3"],
          author: "Alice",
          email: "alice@example.com",
          date: 1700000200,
          message: "Second",
          refs: []
        },
        {
          hash: "h3",
          parentHashes: ["h4"],
          author: "Zoe",
          email: "zoe@example.com",
          date: 1700000100,
          message: "Third",
          refs: []
        },
        {
          hash: "h4",
          parentHashes: [],
          author: "Bob",
          email: "bob@example.com",
          date: 1700000000,
          message: "Oldest",
          refs: []
        }
      ],
      head: "h1",
      moreCommitsAvailable: false,
      hard: true
    });

    openAuthorDropdown();

    const options = getAuthorOptions().slice(1);

    expect(options).toEqual(["Zoe", "Alice", "Bob"]);
  });

  it("shows all authors again when clicking the field with a selected author", () => {
    receive({
      command: "loadAuthors",
      authors: ["Zoe", "Alice", "Bob"],
      hard: true
    });
    receive({
      command: "loadCommits",
      commits: [
        {
          hash: "x1",
          parentHashes: ["x2"],
          author: "Zoe",
          email: "zoe@example.com",
          date: 1700000300,
          message: "Newest",
          refs: []
        },
        {
          hash: "x2",
          parentHashes: ["x3"],
          author: "Alice",
          email: "alice@example.com",
          date: 1700000200,
          message: "Second",
          refs: []
        },
        {
          hash: "x3",
          parentHashes: [],
          author: "Bob",
          email: "bob@example.com",
          date: 1700000100,
          message: "Oldest",
          refs: []
        }
      ],
      head: "x1",
      moreCommitsAvailable: false,
      hard: true
    });

    openAuthorDropdown();
    const authorInput = getAuthorFilterInput();
    authorInput.value = "Alice";
    authorInput.dispatchEvent(new Event("input"));

    receive({
      command: "loadCommits",
      commits: [
        {
          hash: "xa",
          parentHashes: [],
          author: "Alice",
          email: "alice@example.com",
          date: 1700000400,
          message: "Filtered",
          refs: []
        }
      ],
      head: "xa",
      moreCommitsAvailable: false,
      hard: true
    });

    openAuthorDropdown();

    const options = getAuthorOptions().slice(1);

    expect(options).toEqual(["Zoe", "Alice", "Bob"]);
    expect(document.querySelectorAll("#authorSelect .dropdownOption.selected")).toHaveLength(1);
    expect(document.querySelector("#authorSelect .dropdownOption.selected")?.textContent).toBe(
      "Alice"
    );
  });
});
