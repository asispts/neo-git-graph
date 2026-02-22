<div align="center">
  <img src="./resources/icon.png" height="128"/>
  <samp>
    <h1>(neo) Git Graph for Visual Studio Code</h1>
    <h3>VS Code extension to visualize git history graph, with git actions and devcontainer support</h3>
  </samp>
</div>

![](https://img.shields.io/github/license/asispts/neo-git-graph)
[![](https://img.shields.io/visual-studio-marketplace/v/asispts.neo-git-graph?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph)
[![](https://img.shields.io/visual-studio-marketplace/i/asispts.neo-git-graph)](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph)
[![open-vsx](https://img.shields.io/open-vsx/v/asispts/neo-git-graph)](https://open-vsx.org/extension/asispts/neo-git-graph)

<p>&nbsp;</p>

![demo](resources/demo.gif)

## Why This Fork

The original [Git Graph](https://github.com/mhutchie/vscode-git-graph) by mhutchie changed its license in May 2019 — everything after [commit 4af8583](https://github.com/mhutchie/vscode-git-graph/commit/4af8583a42082b2c230d2c0187d4eaff4b69c665) is no longer MIT. This fork picks up from that last MIT commit and adds:

- **MIT license** — safe to use in any project or organization
- **Devcontainer support** — the original fails to load its webview in remote/container environments due to deprecated VS Code APIs; this fork uses the modern `asWebviewUri()` approach that works everywhere
- **Updated toolchain** — TypeScript 5, esbuild, current VS Code APIs

## Features

- **Graph View**: Visualize all branches, tags, and uncommitted changes in one interactive graph (rounded or angular style, configurable colors)
- **Commit Details**: Click a commit to see the full message, changed files, and per-file diffs
- **Branch Actions**: Right-click to create, checkout, rename, delete, or merge branches
- **Tag Actions**: Create lightweight or annotated tags, delete, and push to remote
- **Commit Actions**: Checkout, cherry-pick, revert, or reset (soft/mixed/hard) to any commit
- **Avatar Support**: Optionally fetch commit author avatars from GitHub, GitLab, or Gravatar
- **Multi-Repository**: Discover and switch between multiple Git repositories in one workspace
- **Devcontainer Ready**: Works correctly in VS Code remote and devcontainer environments

## Configuration

All settings are under the `neo-git-graph` namespace.

| Setting                       | Default         | Description                                                                                     |
| ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `autoCenterCommitDetailsView` | `true`          | Auto-scroll to center the commit details panel when opened                                      |
| `dateFormat`                  | `"Date & Time"` | Display format: `"Date & Time"`, `"Date Only"`, or `"Relative"`                                 |
| `dateType`                    | `"Author Date"` | Which date to show: `"Author Date"` or `"Commit Date"`                                          |
| `fetchAvatars`                | `false`         | Fetch author avatars from GitHub/GitLab/Gravatar (sends email addresses to those services)      |
| `graphColours`                | 12 defaults     | Array of HEX or RGB colors used to color graph lanes                                            |
| `graphStyle`                  | `"rounded"`     | Graph line style: `"rounded"` or `"angular"`                                                    |
| `initialLoadCommits`          | `300`           | Number of commits to load on open                                                               |
| `loadMoreCommits`             | `100`           | Number of commits to load when clicking "Load More Commits"                                     |
| `maxDepthOfRepoSearch`        | `0`             | Max subfolder depth when discovering repositories in the workspace                              |
| `showCurrentBranchByDefault`  | `false`         | Show only the current branch (instead of all branches) when opening                             |
| `showStatusBarItem`           | `true`          | Show a clickable Git Graph item in the status bar                                               |
| `showUncommittedChanges`      | `true`          | Show uncommitted changes as a node in the graph (disable to improve performance on large repos) |
| `tabIconColourTheme`          | `"colour"`      | Tab icon style: `"colour"` or `"grey"`                                                          |

## Installation

Search for `neo-git-graph` in the Extensions panel, or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph) or [Open VSX Registry](https://open-vsx.org/extension/asispts/neo-git-graph).

## Roadmap

**Completed**

- [x] Fix activation event (`*` → `onStartupFinished`)
- [x] Fix extension not activating in devcontainers
- [x] Upgrade dependencies and toolchain

**Upcoming**

- [ ] Add integration/functional test suite (extension, git backend, webview)
- [ ] Modernize the codebase (refactor, type-safety improvements)

## License

MIT — see [LICENSE](LICENSE).

> Not affiliated with or endorsed by the original Git Graph project.
