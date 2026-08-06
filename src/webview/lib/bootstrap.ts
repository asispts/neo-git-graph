import type { ResponseMessage } from "@/types";

import { handleLoadRepos } from "./handler/load-repo";
import { vscode } from "./vscode";

type Command = ResponseMessage["command"];

type HandlerMap = {
  [C in Command]?: (msg: Extract<ResponseMessage, { command: C }>) => void;
};

export function initWebview() {
  const handlers: HandlerMap = {
    loadRepos: handleLoadRepos
    //   loadBranches: handleLoadBranches,
    //   refresh: handleRefresh
  };

  window.addEventListener("message", (e: MessageEvent<ResponseMessage>) => {
    const handler = handlers[e.data.command] as ((msg: ResponseMessage) => void) | undefined;

    if (handler === undefined) {
      // eslint-disable-next-line no-console
      console.warn("no handler for", e.data.command);
      return;
    }

    handler(e.data);
  });

  vscode.postMessage({ command: "loadRepos", check: false });
}
