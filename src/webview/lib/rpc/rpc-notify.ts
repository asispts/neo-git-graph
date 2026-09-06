import type { RpcNotification } from "@/types";
import { refresh } from "@/webview/lib/actions";
import { selectedRepo } from "@/webview/lib/stores";
import { repoListStore } from "@/webview/lib/stores/repo-list.store";

export function handleRpcNotification(message: unknown): boolean {
  if (!isRpcNotification(message)) {
    return false;
  }

  switch (message.name) {
    case "repo.changed":
      repoListStore.apply(message.message);
      return true;
    case "repo.updated":
      if (message.message.path === selectedRepo.value) {
        refresh();
      }
      return true;
  }
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
    (message.name === "repo.changed" || message.name === "repo.updated") &&
    "message" in message
  );
}
