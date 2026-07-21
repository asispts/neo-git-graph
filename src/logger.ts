import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | null = null;

export function initLogger(ctx: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("Neo Git Graph");
  ctx.subscriptions.push(outputChannel);
}

export function log(msg: string) {
  if (!outputChannel) {
    console.warn("[Neo Git Graph] log() called before initLogger()");
    return;
  }
  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").replace("Z", "");
  outputChannel.appendLine(`[${timestamp}] ${msg}`);
}
