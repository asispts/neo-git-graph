<div align="center">
  <img src="./resources/icon.png" height="128"/>
  <samp>
    <h1>(neo) Git Graph for Visual Studio Code</h1>
    <h3>An MIT-licensed fork of Git Graph with visual history, branch actions, and devcontainer support.</h3>
  </samp>
</div>

<h4 align="center">
  <a href="#why-this-fork">Why this fork</a> |
  <a href="#features">Features</a> |
  <a href="#installation">Installation</a> |
  <a href="#roadmap">Roadmap</a> |
  <a href="#configuration">Configuration</a> |
  <a href="#contributing">Contributing</a> |
  <a href="#sponsors">Sponsors</a>
</h4>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/asispts/neo-git-graph" alt="License"></a>
  <a href="https://github.com/asispts/neo-git-graph/releases"><img alt="GitHub release" src="https://img.shields.io/github/v/release/asispts/neo-git-graph"></a>
  <a href="https://open-vsx.org/extension/asispts/neo-git-graph"><img alt="open-vsx downloads" src="https://img.shields.io/open-vsx/dt/asispts/neo-git-graph?label=open-vsx"></a>
</p>

<!-- ![demo](resources/demo.gif) -->

<p>&nbsp;</p>

## Why this fork

The original [Git Graph](https://github.com/mhutchie/vscode-git-graph) by mhutchie changed its license in May 2019.
This fork is based on the last MIT-licensed commit, [`4af8583`](https://github.com/mhutchie/vscode-git-graph/commit/4af8583a42082b2c230d2c0187d4eaff4b69c665).

Everything after that commit is no longer MIT-licensed.

This fork:

- Remains MIT-licensed
- Adds devcontainer support
- Adds internationalization support (English, zh-CN, zh-TW)
- Improves codebase, tooling, and maintainability

## Features

- **Graph view**: See branches, tags, and uncommitted changes in one graph
- **Commit details**: Click a commit to see message, files, and diffs
- **Branch actions**: Create, checkout, rename, delete, and merge
- **Tag actions**: Create, delete, and push tags
- **Commit actions**: Checkout, cherry-pick, revert, and reset
- **Avatar support**: Optional avatars from GitHub, GitLab, or Gravatar
- **Multi-repo**: Work with multiple repositories in one workspace
- **Devcontainer support**: Works in remote and container environments

## Installation

Search for `neo-git-graph` in Extensions, or install from:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=asispts.neo-git-graph)
- [Open VSX Registry](https://open-vsx.org/extension/asispts/neo-git-graph)

## Roadmap

- **v0.6.0:** Migrate the legacy webview to Preact
- **v0.7.0:** Refine the extension and backend APIs after the webview migration
- **v0.8.0:** Redesign the user interface and commit list
- **v0.9.0 and later:** Close the main feature gaps with the original Git Graph

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

## Contributing

Pull requests from external contributors are currently limited while the project undergoes heavy refactoring.

Please use [Issues](https://github.com/asispts/neo-git-graph/issues) for bug reports, feature requests, and discussion.

See the [Roadmap](#roadmap) for the project's current direction.

## Sponsors

If you find this extension useful, consider [sponsoring its development](https://github.com/sponsors/asispts).
Your support helps keep it maintained and improving.

<!-- Sponsor names and logos go here -->

## License

MIT — see [LICENSE](LICENSE).

> Not related to the original Git Graph project.
