import * as assert from "node:assert";

import * as vscode from "vscode";

suite("GitGraphPanel", () => {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension("asispts.neo-git-graph");
    await ext?.activate();
  });

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  function isPanelOpen() {
    return vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .some((t) => t.label === "(neo) Git Graph");
  }

  test("view command opens the panel", async () => {
    await vscode.commands.executeCommand("neo-git-graph.view");
    const deadline = Date.now() + 2000;
    while (!isPanelOpen() && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.ok(isPanelOpen(), "Panel should be visible after executing view command");
  });
});
