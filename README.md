<div align="center">
  <img src="./resources/icon.png" height="128"/>
  <samp>
    <h1>(neo) Git Graph for Visual Studio Code</h1>
    <h3>View your Git history as a graph with Git actions and devcontainer support</h3>
  </samp>
</div>

[![](https://img.shields.io/github/license/asispts/neo-git-graph)](https://github.com/asispts/neo-git-graph?tab=MIT-1-ov-file)
[![GitHub release](https://img.shields.io/github/v/release/asispts/neo-git-graph)](https://github.com/asispts/neo-git-graph/releases)
[![vscode downloads](https://img.shields.io/visual-studio-marketplace/d/asispts.neo-git-graph?label=download)](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph)
[![vscode installs](https://img.shields.io/visual-studio-marketplace/i/asispts.neo-git-graph?label=install)](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph)
[![open-vsx downloads](https://img.shields.io/open-vsx/dt/asispts/neo-git-graph?label=open-vsx)](https://open-vsx.org/extension/asispts/neo-git-graph)

![demo](resources/demo.gif)

<p>&nbsp;</p>

## Why this fork

The original [Git Graph](https://github.com/mhutchie/vscode-git-graph) by mhutchie changed its license in May 2019.
Everything after [commit 4af8583](https://github.com/mhutchie/vscode-git-graph/commit/4af8583a42082b2c230d2c0187d4eaff4b69c665) is no longer MIT.

This fork is based on the last MIT commit and:

- Keeps MIT license
- Adds devcontainer support
- Improves codebase, tooling, and maintainability

## Features

- **Graph view**: See branches, tags, and uncommitted changes in one graph
- **Commit details**: Click a commit to see message, files, and diffs
- **Branch actions**: Create, checkout, rename, delete, and merge
- **Tag actions**: Create, delete, and push tags
- **Commit actions**: Checkout, cherry-pick, revert, and reset
- **Avatar support**: Optional avatars from GitHub, GitLab, or Gravatar
- **Multi-repo**: Work with multiple repositories in one workspace
- **Devcontainer ready**: Works in remote and container environments

## Configuration

All settings use the `neo-git-graph` prefix.

| Setting                       | Default         | Description                                      |
| ----------------------------- | --------------- | ------------------------------------------------ |
| `autoCenterCommitDetailsView` | `true`          | Center commit details when opened                |
| `dateFormat`                  | `"Date & Time"` | `"Date & Time"`, `"Date Only"`, or `"Relative"`  |
| `dateType`                    | `"Author Date"` | `"Author Date"` or `"Commit Date"`               |
| `fetchAvatars`                | `false`         | Fetch avatars (sends email to external services) |
| `graphColours`                | 12 defaults     | Colors for graph lines                           |
| `graphStyle`                  | `"rounded"`     | `"rounded"` or `"angular"`                       |
| `initialLoadCommits`          | `300`           | Commits to load on open                          |
| `loadMoreCommits`             | `100`           | Commits to load on demand                        |
| `maxDepthOfRepoSearch`        | `0`             | Folder depth for repo search                     |
| `showCurrentBranchByDefault`  | `false`         | Show only current branch on open                 |
| `showStatusBarItem`           | `true`          | Show status bar button                           |
| `showUncommittedChanges`      | `true`          | Show uncommitted changes node                    |
| `tabIconColourTheme`          | `"colour"`      | `"colour"` or `"grey"`                           |

## Installation

Search for `neo-git-graph` in Extensions, or install from:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph)
- [Open VSX Registry](https://open-vsx.org/extension/asispts/neo-git-graph)

## License

MIT — see [LICENSE](LICENSE).

> Not related to the original Git Graph project.
