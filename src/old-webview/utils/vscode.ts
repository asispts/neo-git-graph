import * as GG from "@/types";

const vscode = acquireVsCodeApi();
export { vscode };

export function sendMessage(msg: GG.RequestMessage) {
  vscode.postMessage(msg);
}
export function getVSCodeStyle(name: string) {
  return document.documentElement.style.getPropertyValue(name);
}
