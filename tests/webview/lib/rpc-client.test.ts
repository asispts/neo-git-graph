import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { rpc } from "@/webview/lib/rpc/rpc-client";

import { vscodeApi } from "@tests/webview/setup";

beforeEach(() => {
  vscodeApi.postMessage.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

it("rejects a request that times out", async () => {
  vi.useFakeTimers();
  const result = rpc.call("clipboard.copy", "commit");
  const rejection = expect(result).rejects.toThrow("RPC request timed out: clipboard.copy");
  await vi.runAllTimersAsync();

  await rejection;
});
