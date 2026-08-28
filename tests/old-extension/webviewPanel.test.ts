import { beforeEach, describe, expect, it, vi } from "vitest";

import { createWebviewPanel } from "@/old-extension/webviewPanel";

const mocks = vi.hoisted(() => ({
  buildWebviewHtml: vi.fn(() => ({ html: "<html>initial</html>", isGraphLoaded: true }))
}));

vi.mock("@/old-extension/webviewHtml", () => ({ buildWebviewHtml: mocks.buildWebviewHtml }));
vi.mock("@/backend/utils/path", () => ({
  buildExtensionUri: (...parts: string[]) => parts.join("/")
}));

describe("createWebviewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the webview document and refreshes data after a hide-and-show cycle", () => {
    let viewStateHandler: (() => void) | undefined;
    const webview = { html: "" };
    const panel = {
      visible: true,
      webview,
      iconPath: undefined,
      onDidDispose: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChangeViewState: vi.fn((handler: () => void) => {
        viewStateHandler = handler;
        return { dispose: vi.fn() };
      }),
      reveal: vi.fn(),
      dispose: vi.fn()
    };
    const bridge = { post: vi.fn() };
    const repoFileWatcher = { stop: vi.fn() };
    const repoManager = {
      getRepos: vi.fn(() => ({ "/repo": { columnWidths: null } }))
    };
    const onPanelShown = vi.fn();

    createWebviewPanel({
      panel: panel as unknown as import("vscode").WebviewPanel,
      bridge: bridge as unknown as import("@/old-extension/webviewBridge").WebviewBridge,
      config: {
        tabIconColourTheme: () => "colour"
      } as unknown as import("@/old-extension/config").Config,
      repoFileWatcher:
        repoFileWatcher as unknown as import("@/old-extension/repoFileWatcher").RepoFileWatcher,
      extensionPath: "/extension",
      extensionState: {
        getLastActiveRepo: () => "/repo"
      } as unknown as import("@/old-extension/extensionState").ExtensionState,
      avatarManager: {
        deregisterBridge: vi.fn()
      } as unknown as import("@/old-extension/avatarManager").AvatarManager,
      repoManager: repoManager as unknown as import("@/old-extension/repoManager").RepoManager,
      onDispose: vi.fn(),
      onPanelShown
    });

    expect(webview.html).toBe("<html>initial</html>");
    expect(mocks.buildWebviewHtml).toHaveBeenCalledTimes(1);

    panel.visible = false;
    viewStateHandler?.();
    expect(repoFileWatcher.stop).toHaveBeenCalledTimes(1);

    panel.visible = true;
    viewStateHandler?.();

    expect(onPanelShown).toHaveBeenCalledTimes(1);
    expect(bridge.post).toHaveBeenCalledOnce();
    expect(bridge.post).toHaveBeenCalledWith({ command: "refresh" });
    expect(webview.html).toBe("<html>initial</html>");
    expect(mocks.buildWebviewHtml).toHaveBeenCalledTimes(1);
  });
});
