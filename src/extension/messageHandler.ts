import * as vscode from "vscode";

import { AvatarManager } from "../avatarManager";
import { GitClientManager } from "../backend/features/gitClient";
import { abbrevCommit, copyToClipboard } from "../backend/utils";
import { DataSource } from "../dataSource";
import { encodeDiffDocUri } from "../diffDocProvider";
import { ExtensionState } from "../extensionState";
import { RepoFileWatcher } from "../repoFileWatcher";
import { RepoManager } from "../repoManager";
import { GitFileChangeType } from "../types";
import { WebviewBridge } from "./webviewBridge";

function viewDiff(
  repo: string,
  commitHash: string,
  oldFilePath: string,
  newFilePath: string,
  type: GitFileChangeType
): Promise<boolean> {
  const abbrevHash = abbrevCommit(commitHash);
  const pathComponents = newFilePath.split("/");
  const title =
    pathComponents[pathComponents.length - 1] +
    " (" +
    (type === "A"
      ? "Added in " + abbrevHash
      : type === "D"
        ? "Deleted in " + abbrevHash
        : abbrevCommit(commitHash) + "^ ↔ " + abbrevCommit(commitHash)) +
    ")";
  return new Promise<boolean>((resolve) => {
    vscode.commands
      .executeCommand(
        "vscode.diff",
        encodeDiffDocUri(repo, oldFilePath, commitHash + "^"),
        encodeDiffDocUri(repo, newFilePath, commitHash),
        title,
        { preview: true }
      )
      .then(() => resolve(true))
      .then(() => resolve(false));
  });
}

export function registerMessageHandlers(
  bridge: WebviewBridge,
  deps: {
    dataSource: DataSource;
    gitManager: GitClientManager;
    repoManager: RepoManager;
    extensionState: ExtensionState;
    avatarManager: AvatarManager;
    repoFileWatcher: RepoFileWatcher;
    getCurrentRepo: () => string | null;
    setCurrentRepo: (repo: string) => void;
  }
) {
  const {
    dataSource,
    gitManager,
    repoManager,
    extensionState,
    avatarManager,
    repoFileWatcher,
    getCurrentRepo,
    setCurrentRepo
  } = deps;

  bridge.onMessage("addTag", async (msg) => {
    bridge.post({
      command: "addTag",
      status: await dataSource.addTag(
        msg.repo,
        msg.tagName,
        msg.commitHash,
        msg.lightweight,
        msg.message
      )
    });
  });

  bridge.onMessage("fetchAvatar", (msg) => {
    avatarManager.fetchAvatarImage(msg.email, msg.repo, msg.commits);
  });

  bridge.onMessage("checkoutBranch", async (msg) => {
    bridge.post({
      command: "checkoutBranch",
      status: await dataSource.checkoutBranch(msg.repo, msg.branchName, msg.remoteBranch)
    });
  });

  bridge.onMessage("checkoutCommit", async (msg) => {
    bridge.post({
      command: "checkoutCommit",
      status: await dataSource.checkoutCommit(msg.repo, msg.commitHash)
    });
  });

  bridge.onMessage("cherrypickCommit", async (msg) => {
    bridge.post({
      command: "cherrypickCommit",
      status: await dataSource.cherrypickCommit(msg.repo, msg.commitHash, msg.parentIndex)
    });
  });

  bridge.onMessage("commitDetails", async (msg) => {
    bridge.post({
      command: "commitDetails",
      commitDetails: await dataSource.commitDetails(msg.repo, msg.commitHash)
    });
  });

  bridge.onMessage("copyToClipboard", async (msg) => {
    bridge.post({
      command: "copyToClipboard",
      type: msg.type,
      success: await copyToClipboard(msg.data)
    });
  });

  bridge.onMessage("createBranch", async (msg) => {
    bridge.post({
      command: "createBranch",
      status: await dataSource.createBranch(msg.repo, msg.branchName, msg.commitHash)
    });
  });

  bridge.onMessage("deleteBranch", async (msg) => {
    bridge.post({
      command: "deleteBranch",
      status: await dataSource.deleteBranch(msg.repo, msg.branchName, msg.forceDelete)
    });
  });

  bridge.onMessage("deleteTag", async (msg) => {
    bridge.post({
      command: "deleteTag",
      status: await dataSource.deleteTag(msg.repo, msg.tagName)
    });
  });

  bridge.onMessage("selectRepo", (msg) => {
    if (msg.repo === getCurrentRepo()) return;
    gitManager.setRepo(msg.repo);
    setCurrentRepo(msg.repo);
    extensionState.setLastActiveRepo(msg.repo);
    repoFileWatcher.start(msg.repo);
  });

  bridge.onMessage("loadBranches", async (msg) => {
    const branchData = await gitManager.get().branch.list(msg.showRemoteBranches);
    const isRepo = branchData.error ? await dataSource.isGitRepository(getCurrentRepo()!) : true;
    bridge.post({
      command: "loadBranches",
      branches: branchData.branches,
      head: branchData.head,
      hard: msg.hard,
      isRepo
    });
  });

  bridge.onMessage("loadAuthors", async (msg) => {
    bridge.post({
      command: "loadAuthors",
      authors: await dataSource.getAuthors(
        msg.repo,
        msg.branchName,
        msg.maxCommits,
        msg.showRemoteBranches
      ),
      hard: msg.hard
    });
  });

  bridge.onMessage("loadCommits", async (msg) => {
    bridge.post({
      command: "loadCommits",
      ...(await dataSource.getCommits(
        msg.repo,
        msg.branchName,
        msg.author,
        msg.maxCommits,
        msg.showRemoteBranches
      )),
      hard: msg.hard
    });
  });

  bridge.onMessage("loadRepos", async (msg) => {
    if (!msg.check || !(await repoManager.checkReposExist())) {
      bridge.post({
        command: "loadRepos",
        repos: repoManager.getRepos(),
        lastActiveRepo: extensionState.getLastActiveRepo()
      });
    }
  });

  bridge.onMessage("mergeBranch", async (msg) => {
    bridge.post({
      command: "mergeBranch",
      status: await dataSource.mergeBranch(msg.repo, msg.branchName, msg.createNewCommit)
    });
  });

  bridge.onMessage("mergeCommit", async (msg) => {
    bridge.post({
      command: "mergeCommit",
      status: await dataSource.mergeCommit(msg.repo, msg.commitHash, msg.createNewCommit)
    });
  });

  bridge.onMessage("pushTag", async (msg) => {
    bridge.post({
      command: "pushTag",
      status: await dataSource.pushTag(msg.repo, msg.tagName)
    });
  });

  bridge.onMessage("renameBranch", async (msg) => {
    bridge.post({
      command: "renameBranch",
      status: await dataSource.renameBranch(msg.repo, msg.oldName, msg.newName)
    });
  });

  bridge.onMessage("resetToCommit", async (msg) => {
    bridge.post({
      command: "resetToCommit",
      status: await dataSource.resetToCommit(msg.repo, msg.commitHash, msg.resetMode)
    });
  });

  bridge.onMessage("revertCommit", async (msg) => {
    bridge.post({
      command: "revertCommit",
      status: await dataSource.revertCommit(msg.repo, msg.commitHash, msg.parentIndex)
    });
  });

  bridge.onMessage("saveRepoState", (msg) => {
    repoManager.setRepoState(msg.repo, msg.state);
  });

  bridge.onMessage("viewDiff", async (msg) => {
    bridge.post({
      command: "viewDiff",
      success: await viewDiff(msg.repo, msg.commitHash, msg.oldFilePath, msg.newFilePath, msg.type)
    });
  });
}
