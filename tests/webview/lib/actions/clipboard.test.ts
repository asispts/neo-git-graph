// @vitest-environment jsdom

import { beforeAll, beforeEach, expect, it, vi } from "vitest";

import type { GitCommitNode } from "@/backend/types";
import type { RpcRequest, RpcResponse } from "@/types";
import { commitMenu } from "@/webview/lib/menus";
import * as stores from "@/webview/lib/stores";

import { vscodeApi } from "@tests/webview/setup";
import { setupWebviewTest } from "@tests/webview/test-utils";

const commit: GitCommitNode = {
  hash: "commit",
  parentHashes: [],
  author: "Author",
  email: "author@example.com",
  date: 0,
  message: "Message",
  refs: []
};

beforeAll(() => {
  setupWebviewTest({ dispatchMessages: true });
});

beforeEach(() => {
  vscodeApi.postMessage.mockClear();
  stores.dialog.value = null;
});

it("copies a commit hash through RPC", async () => {
  const entry = commitMenu(commit, new Map()).find((item) => item?.title === "copyCommitHash");

  expect(entry).toBeDefined();
  entry!.onClick();

  const message = vscodeApi.postMessage.mock.calls[0]?.[0];
  expect(message).toBeDefined();
  const request = message as RpcRequest<"clipboard.copy">;
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
