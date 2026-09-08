import type { RpcNotification, RpcResponse } from "@/types";
import { refresh } from "@/webview/lib/actions";
import { loadRepoList } from "@/webview/lib/load-repos";
import { selectedRepo } from "@/webview/lib/stores";
import { repoListStore } from "@/webview/lib/stores/repo-list.store";

export type PendingRpcRequest = {
  resolve: (value: unknown) => void;
  reject: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export function initRpcHandler(requests: Map<string, PendingRpcRequest>): void {
  window.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (isRpcResponse(event.data)) {
      handleRpcResponse(event.data, requests);
      return;
    }

    if (isRpcNotification(event.data)) {
      handleRpcNotification(event.data);
    }
  });
}

function handleRpcResponse(message: RpcResponse, requests: Map<string, PendingRpcRequest>): void {
  const request = requests.get(message.id);
  if (request === undefined) {
    return;
  }
  requests.delete(message.id);
  clearTimeout(request.timeout);

  if (message.success) {
    request.resolve(message.result);
  } else {
    request.reject(new Error(message.error));
  }
}

function handleRpcNotification(message: RpcNotification): void {
  switch (message.name) {
    case "repo.changed":
      repoListStore.apply(message.message);
      return;
    case "repo.rescan":
      void loadRepoList();
      return;
    case "repo.updated":
      if (message.message.path === selectedRepo.value) {
        refresh();
      }
  }
}

function isRpcResponse(message: unknown): message is RpcResponse {
  if (
    typeof message !== "object" ||
    message === null ||
    !("kind" in message) ||
    message.kind !== "rpc.response" ||
    !("id" in message) ||
    typeof message.id !== "string" ||
    !("success" in message) ||
    typeof message.success !== "boolean"
  ) {
    return false;
  }

  if (message.success) {
    return "result" in message;
  }

  return "error" in message && typeof message.error === "string";
}

function isRpcNotification(message: unknown): message is RpcNotification {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "rpc.notify" &&
    "id" in message &&
    typeof message.id === "string" &&
    "name" in message &&
    typeof message.name === "string" &&
    "message" in message
  );
}
