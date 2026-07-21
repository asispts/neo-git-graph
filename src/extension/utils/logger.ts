import * as vscode from "vscode";

let _channel: vscode.OutputChannel | undefined;

export const logger = {
  init: (ctx: vscode.ExtensionContext) => {
    _channel = vscode.window.createOutputChannel("Neo Git Graph");
    ctx.subscriptions.push(_channel);
  },

  log: (msg: string) => {
    if (!_channel) {
      // eslint-disable-next-line no-console
      console.warn("[Neo Git Graph] log() called before initLogger()");
      return;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").replace("Z", "");
    _channel.appendLine(`[${timestamp}] ${msg}`);
  }
};
