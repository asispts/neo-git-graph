import { vscodeApi } from "./api";

export function readState<T>(): T | null {
  const state = vscodeApi.getState();
  return state !== null && typeof state === "object" ? (state as T) : null;
}

export function writeState<T>(state: T): void {
  vscodeApi.setState(state);
}
