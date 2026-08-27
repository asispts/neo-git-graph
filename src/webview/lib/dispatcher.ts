import type { ResponseMessage } from "@/types";
import { handleRpcResponse } from "@/webview/lib/rpc/rpc-client";

import { handleActionResult } from "./handler/action-result";
import { handleCommitDetails } from "./handler/commit-details";
import { handleLoadBranches } from "./handler/load-branches";
import { handleLoadCommits } from "./handler/load-commits";
import { handleLoadRepos } from "./handler/load-repo";
import { handleRefresh } from "./handler/refresh";
import { handleViewDiff } from "./handler/view-diff";

type Command = ResponseMessage["command"];

type Handlers = {
  [C in Command]?: (msg: Extract<ResponseMessage, { command: C }>) => void;
};

const handlers: Handlers = {
  addTag: handleActionResult,
  checkoutBranch: handleActionResult,
  checkoutCommit: handleActionResult,
  cherrypickCommit: handleActionResult,
  createBranch: handleActionResult,
  deleteBranch: handleActionResult,
  deleteTag: handleActionResult,
  mergeBranch: handleActionResult,
  mergeCommit: handleActionResult,
  pushTag: handleActionResult,
  renameBranch: handleActionResult,
  resetToCommit: handleActionResult,
  revertCommit: handleActionResult,
  commitDetails: handleCommitDetails,
  loadRepos: handleLoadRepos,
  loadBranches: handleLoadBranches,
  loadCommits: handleLoadCommits,
  refresh: handleRefresh,
  viewDiff: handleViewDiff
};

export function initDispatcher() {
  window.addEventListener("message", (e: MessageEvent<unknown>) => {
    if (handleRpcResponse(e.data)) {
      return;
    }
    dispatch(e.data as ResponseMessage);
  });
}

function dispatch(msg: ResponseMessage): void {
  const handle = handlers[msg.command] as ((m: ResponseMessage) => void) | undefined;

  if (handle === undefined) {
    // eslint-disable-next-line no-console
    console.warn("no handler for", msg.command);
    return;
  }

  handle(msg);
}
