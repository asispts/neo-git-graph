// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { GitCommitNode } from "@/backend/types";
import type { LocalizedStrings } from "@/old-extension/l10n/webviewL10n";
import type { WebviewConfig } from "@/types";
import { initializeWebviewConfig } from "@/webview/lib/webview-config";

import { vscodeApi } from "@tests/webview/setup";

let commitMenu: typeof import("@/webview/lib/menus").commitMenu;
let stores: typeof import("@/webview/lib/stores");

const commit: GitCommitNode = {
  hash: "commit",
  parentHashes: [],
  author: "Author",
  email: "author@example.com",
  date: 0,
  message: "Message",
  refs: []
};

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
  Object.defineProperty(window, "l10n", {
    value: new Proxy({}, { get: (_target, key) => String(key) }) as LocalizedStrings,
    configurable: true
  });

  ({ commitMenu } = await import("@/webview/lib/menus"));
  stores = await import("@/webview/lib/stores");
});

beforeEach(() => {
  vscodeApi.postMessage.mockClear();
  stores.dialog.value = null;
  stores.selectedRepo.value = "repo";
});

function openAction(command: "cherrypickCommit" | "revertCommit", parentHashes: string[]) {
  const title = command === "cherrypickCommit" ? "cherryPick…" : "revert…";
  const entry = commitMenu({ ...commit, parentHashes }, new Map()).find(
    (item) => item?.title === title
  );

  expect(entry).toBeDefined();
  entry!.onClick();

  const open = stores.dialog.value;
  expect(open?.kind).toBe("form");
  if (open?.kind !== "form") {
    throw new Error("Expected a form dialog");
  }
  return open;
}

describe.each(["cherrypickCommit", "revertCommit"] as const)("%s menu", (command) => {
  it.each([
    ["root", []],
    ["normal", ["parent-1"]]
  ])("treats a %s commit as a normal commit", (_type, parentHashes) => {
    const form = openAction(command, parentHashes);

    expect(form.inputs).toEqual([]);
    form.onSubmit([]);
    expect(vscodeApi.postMessage).toHaveBeenCalledWith({
      command,
      repo: "repo",
      commitHash: "commit",
      parentIndex: 0
    });
  });

  it("requires a mainline parent for a merge commit", () => {
    const form = openAction(command, ["parent-1", "parent-2"]);

    expect(form.inputs).toEqual([
      {
        kind: "select",
        value: "1",
        options: [
          { label: "parent-1", value: "1" },
          { label: "parent-2", value: "2" }
        ]
      }
    ]);
    form.onSubmit(["2"]);
    expect(vscodeApi.postMessage).toHaveBeenCalledWith({
      command,
      repo: "repo",
      commitHash: "commit",
      parentIndex: 2
    });
  });
});
