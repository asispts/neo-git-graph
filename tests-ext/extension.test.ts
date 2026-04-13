import * as assert from "node:assert";

import * as vscode from "vscode";

suite("GitGraphPanel", () => {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension("asispts.neo-git-graph");
    await ext?.activate();
  });

  setup(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await new Promise((r) => setTimeout(r, 200));
  });

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  function isPanelOpen() {
    return vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .some((t) => t.label === "(neo) Git Graph");
  }

  async function openPanel() {
    await vscode.commands.executeCommand("neo-git-graph.view");
    const deadline = Date.now() + 2000;
    while (!isPanelOpen() && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50)); // eslint-disable-line no-await-in-loop
    }
  }

  test("view command opens the panel", async () => {
    await openPanel();
    assert.ok(isPanelOpen(), "Panel should be visible after executing view command");
  });

  test("running view command a second time reveals rather than opening a new tab", async () => {
    await openPanel();
    assert.ok(isPanelOpen());

    const tabsBefore = vscode.window.tabGroups.all.flatMap((g) => g.tabs).length;
    await vscode.commands.executeCommand("neo-git-graph.view");
    await new Promise((r) => setTimeout(r, 300));
    const tabsAfter = vscode.window.tabGroups.all.flatMap((g) => g.tabs).length;

    assert.strictEqual(tabsAfter, tabsBefore, "Second invocation should not open a new tab");
  });

  test("closing the panel and running view command opens a fresh panel", async () => {
    await openPanel();
    assert.ok(isPanelOpen());

    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await new Promise((r) => setTimeout(r, 200));
    assert.ok(!isPanelOpen(), "Panel should be closed");

    await openPanel();
    assert.ok(isPanelOpen(), "Panel should reopen after running view command again");
  });
});
