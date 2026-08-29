import * as vscode from "vscode";

export async function initializeRepo(): Promise<boolean> {
  await vscode.commands.executeCommand("git.init");
  return true;
}
