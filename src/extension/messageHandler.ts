import * as vscode from "vscode";

import { AvatarManager } from "../avatarManager";
import { GitBranch } from "../backend/features/gitBranch";
import { GitClient } from "../backend/features/gitClient";
import { GitTag } from "../backend/features/gitTag";
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
    gitClient: GitClient;
    gitBranch: GitBranch;
    gitTag: GitTag;
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
    gitClient,
    gitBranch,
    gitTag,
    repoManager,
    extensionState,
    avatarManager,
    repoFileWatcher,
    getCurrentRepo,
    setCurrentRepo
  } = deps;

  bridge.onMessage("addTag", async (msg) => {
    const result = await gitTag.add(msg.tagName, msg.commitHash, msg.lightweight, msg.message);
    bridge.post({
      command: "addTag",
      status: result.error ? result.message : null
    });
  });

  bridge.onMessage("fetchAvatar", (msg) => {
    avatarManager.fetchAvatarImage(msg.email, msg.repo, msg.commits);
  });

  bridge.onMessage("checkoutBranch", async (msg) => {
    const result = await gitBranch.checkout(msg.branchName, msg.remoteBranch);
    bridge.post({
      command: "checkoutBranch",
      status: result.error ? result.message : null
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
    const result = await gitBranch.create(msg.branchName, msg.commitHash);
    bridge.post({
      command: "createBranch",
      status: result.error ? result.message : null
    });
  });

  bridge.onMessage("deleteBranch", async (msg) => {
    const result = await gitBranch.delete(msg.branchName, msg.forceDelete);
    bridge.post({
      command: "deleteBranch",
      status: result.error ? result.message : null
    });
  });

  bridge.onMessage("deleteTag", async (msg) => {
    const result = await gitTag.delete(msg.tagName);
    bridge.post({
      command: "deleteTag",
      status: result.error ? result.message : null
    });
  });

  bridge.onMessage("selectRepo", (msg) => {
    if (msg.repo === getCurrentRepo()) return;
    gitClient.setRepo(msg.repo);
    setCurrentRepo(msg.repo);
    extensionState.setLastActiveRepo(msg.repo);
    repoFileWatcher.start(msg.repo);
  });

  bridge.onMessage("loadBranches", async (msg) => {
    const branchData = await gitBranch.list(msg.showRemoteBranches);
    const isRepo = branchData.error ? await dataSource.isGitRepository(getCurrentRepo()!) : true;
    bridge.post({
      command: "loadBranches",
      branches: branchData.branches,
      head: branchData.head,
      hard: msg.hard,
      isRepo
    });
  });

  bridge.onMessage("loadCommits", async (msg) => {
    bridge.post({
      command: "loadCommits",
      ...(await dataSource.getCommits(
        msg.repo,
        msg.branchName,
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
    const result = await gitTag.push(msg.tagName);
    bridge.post({
      command: "pushTag",
      status: result.error ? result.message : null
    });
  });

  bridge.onMessage("renameBranch", async (msg) => {
    const result = await gitBranch.rename(msg.oldName, msg.newName);
    bridge.post({
      command: "renameBranch",
      status: result.error ? result.message : null
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
