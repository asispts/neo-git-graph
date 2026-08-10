import type { ResponseMessage } from "@/types";

import { handleLoadBranches } from "./handler/load-branches";
import { handleLoadRepos } from "./handler/load-repo";
import { handleRefresh } from "./handler/refresh";
import { startSync } from "./sync";
import { vscode } from "./vscode";

type Command = ResponseMessage["command"];

type Handler<C extends Command> = (msg: Extract<ResponseMessage, { command: C }>) => void;

type Registry = Map<Command, { handle(msg: ResponseMessage): void }>;

function register<C extends Command>(registry: Registry, command: C, handle: Handler<C>): void {
  registry.set(command, { handle });
}

export function initWebview() {
  const handlers: Registry = new Map();

  register(handlers, "loadRepos", handleLoadRepos);
  register(handlers, "loadBranches", handleLoadBranches);
  register(handlers, "refresh", handleRefresh);

  window.addEventListener("message", (e: MessageEvent<ResponseMessage>) => {
    const entry = handlers.get(e.data.command);

    if (entry === undefined) {
      // eslint-disable-next-line no-console
      console.warn("no handler for", e.data.command);
      return;
    }

    entry.handle(e.data);
  });

  startSync();

  vscode.postMessage({ command: "loadRepos", check: false });
}
