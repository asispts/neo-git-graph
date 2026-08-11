import type { ResponseMessage } from "@/types";

import { handleLoadBranches } from "./handler/load-branches";
import { handleLoadRepos } from "./handler/load-repo";
import { handleRefresh } from "./handler/refresh";
import { startSync } from "./sync";
import { vscode } from "./vscode";

type Command = ResponseMessage["command"];

type Handlers = {
  [C in Command]?: (msg: Extract<ResponseMessage, { command: C }>) => void;
};

const handlers: Handlers = {
  loadRepos: handleLoadRepos,
  loadBranches: handleLoadBranches,
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
