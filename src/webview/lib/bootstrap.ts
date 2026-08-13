import type { ResponseMessage } from "@/types";

import { handleCommitDetails } from "./handler/commit-details";
import { handleCopyToClipboard } from "./handler/copy-to-clipboard";
import { handleLoadBranches } from "./handler/load-branches";
import { handleLoadCommits } from "./handler/load-commits";
import { handleLoadRepos } from "./handler/load-repo";
import { handleRefresh } from "./handler/refresh";
import { startSync } from "./sync";
import { vscode } from "./vscode";

type Command = ResponseMessage["command"];

type Handlers = {
  [C in Command]?: (msg: Extract<ResponseMessage, { command: C }>) => void;
};

const handlers: Handlers = {
  commitDetails: handleCommitDetails,
  copyToClipboard: handleCopyToClipboard,
  loadRepos: handleLoadRepos,
  loadBranches: handleLoadBranches,
  loadCommits: handleLoadCommits,
  refresh: handleRefresh
};

function dispatch(msg: ResponseMessage): void {
  const handle = handlers[msg.command] as ((m: ResponseMessage) => void) | undefined;

  if (handle === undefined) {
    // eslint-disable-next-line no-console
    console.warn("no handler for", msg.command);
    return;
  }

  handle(msg);
}

export function initWebview() {
  window.addEventListener("message", (e: MessageEvent<ResponseMessage>) => {
    dispatch(e.data);
  });

  startSync();

  vscode.postMessage({ command: "loadRepos", check: false });
}
