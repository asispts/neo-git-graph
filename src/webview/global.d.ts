declare module "*.css";

declare function acquireVsCodeApi(): {
  getState(): unknown;
  setState(state: unknown): void;
  postMessage(message: import("@/types").RequestMessage): void;
};

declare let viewState: import("@/types").GitGraphViewState;
