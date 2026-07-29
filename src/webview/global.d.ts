import type { GitGraphViewState, RequestMessage } from "@/types";

declare global {
  function acquireVsCodeApi(): {
    getState(): unknown;
    setState(state: unknown): void;
    postMessage(message: RequestMessage): void;
  };

  var viewState: GitGraphViewState;
}
