import * as vscode from "vscode";

export function copyToClipboard(text: string) {
  return new Promise<boolean>((resolve) => {
    vscode.env.clipboard.writeText(text).then(
      () => resolve(true),
      () => resolve(false)
    );
  });
}
