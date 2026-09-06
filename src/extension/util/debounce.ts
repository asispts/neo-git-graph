import type * as vscode from "vscode";

export type FsWatcherEvent = "created" | "deleted";

export function createDebouncer() {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    debounce(
      type: FsWatcherEvent,
      uri: vscode.Uri,
      callback: (type: FsWatcherEvent, uri: vscode.Uri) => void
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
          callback(type, uri);
        }, 100)
      );
    },
    dispose(): void {
      timers.values().forEach(clearTimeout);
      timers.clear();
    }
  };
}
