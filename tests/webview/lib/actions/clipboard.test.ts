// @vitest-environment jsdom

import { beforeAll, beforeEach, expect, it, vi } from "vitest";

import type { GitCommitNode } from "@/backend/types";
import type { LocalizedStrings } from "@/old-extension/l10n/webviewL10n";
import type { RpcRequest, RpcResponse } from "@/rpc/types";
import type { GitGraphViewState } from "@/types";

import { vscodeApi } from "@tests/webview/setup";

let initWebview: typeof import("@/webview/lib/bootstrap").initWebview;
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
  const state: GitGraphViewState = {
    autoCenterCommitDetailsView: true,
    dateFormat: "Date & Time",
    fetchAvatars: false,
    graphColours: [],
    graphStyle: "rounded",
    initialLoadCommits: 300,
    lastActiveRepo: null,
    loadMoreCommits: 100,
    locale: "en",
    repos: {},
    showCurrentBranchByDefault: false
  };
  Object.defineProperty(globalThis, "viewState", { value: state, configurable: true });
  Object.defineProperty(window, "l10n", {
    value: new Proxy({}, { get: (_target, key) => String(key) }) as LocalizedStrings,
    configurable: true
  });

  ({ initWebview } = await import("@/webview/lib/bootstrap"));
  ({ commitMenu } = await import("@/webview/lib/menus"));
  stores = await import("@/webview/lib/stores");
  initWebview();
});

beforeEach(() => {
  vscodeApi.postMessage.mockClear();
  stores.dialog.value = null;
});

it("copies a commit hash through RPC", async () => {
  const entry = commitMenu(commit, new Map()).find((item) => item?.title === "copyCommitHash");

  expect(entry).toBeDefined();
  entry!.onClick();

  const request = vscodeApi.postMessage.mock.calls[0][0] as RpcRequest<"clipboard.copy">;
  expect(request).toEqual({
    kind: "rpc.request",
    id: expect.any(String),
    method: "clipboard.copy",
    params: "commit"
  });

  const response = {
    kind: "rpc.response",
    id: request.id,
    success: true,
    result: false
  } satisfies RpcResponse<"clipboard.copy">;
  window.dispatchEvent(new MessageEvent("message", { data: response }));

  await vi.waitFor(() => {
    expect(stores.dialog.value).toMatchObject({
      kind: "error",
      message: "unableToCopyToClipboard",
      reason: null
    });
  });
});
