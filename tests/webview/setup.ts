import { vi } from "vitest";

export const vscodeApi = {
  getState: vi.fn(() => undefined),
  setState: vi.fn(),
  postMessage: vi.fn()
};

Object.defineProperty(globalThis, "acquireVsCodeApi", {
  value: vi.fn(() => vscodeApi),
  configurable: true
});
