import * as vscode from "vscode";

export const extConfig = {
  gitBinary: () => vscode.workspace.getConfiguration("git").get("path", null) ?? "git",
  maxDepth: (): number => getConfig("maxDepthOfRepoSearch", 0)
};

function getConfig<T>(key: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration("neo-git-graph").get(key, defaultValue);
}
