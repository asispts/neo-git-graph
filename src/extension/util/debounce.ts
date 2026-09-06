import type * as vscode from "vscode";

import { logger } from "@/old-extension/utils/logger";

export type FsWatcherEvent = "created" | "deleted";

export function createDebouncer() {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    debounce(
      type: FsWatcherEvent,
      uri: vscode.Uri,
      callback: (type: FsWatcherEvent, uri: vscode.Uri) => Promise<void>
    ): void {
      const key = `${type}:${uri.toString()}`;
      const timer = timers.get(key);

      if (timer) {
        clearTimeout(timer);
      }

      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          void callback(type, uri).catch((error: unknown) => {
            logger.log(`Unable to process repository change: ${String(error)}`);
          });
        }, 100)
      );
    },
    dispose(): void {
      timers.values().forEach(clearTimeout);
      timers.clear();
    }
  };
}
