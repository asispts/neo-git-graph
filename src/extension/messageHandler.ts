import * as vscode from "vscode";

import { AvatarManager } from "../avatarManager";
import { GitClientManager } from "../backend/features/gitClient";
import { abbrevCommit, copyToClipboard } from "../backend/utils";
import { DataSource } from "../dataSource";
import { encodeDiffDocUri } from "../diffDocProvider";
import { ExtensionState } from "../extensionState";
import { RepoFileWatcher } from "../repoFileWatcher";
import { RepoManager } from "../repoManager";
import { GitFileChangeType, RequestMessage } from "../types";
import { WebviewBridge } from "./webviewBridge";

function respondLoadRepos(
  repos: ReturnType<RepoManager["getRepos"]>,
  lastActiveRepo: string | null,
  bridge: WebviewBridge
) {
  bridge.post({ command: "loadRepos", repos, lastActiveRepo });
}

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

export function createMessageHandler(deps: {
  dataSource: DataSource;
  gitManager: GitClientManager;
  repoManager: RepoManager;
  extensionState: ExtensionState;
  avatarManager: AvatarManager;
  repoFileWatcher: RepoFileWatcher;
  bridge: WebviewBridge;
  getCurrentRepo: () => string | null;
  setCurrentRepo: (repo: string) => void;
}) {
  const {
    dataSource,
    gitManager,
    repoManager,
    extensionState,
    avatarManager,
    repoFileWatcher,
    bridge,
    getCurrentRepo,
    setCurrentRepo
  } = deps;

  return async function handleMessage(msg: RequestMessage) {
    if (dataSource === null) return;
    repoFileWatcher.mute();
    switch (msg.command) {
      case "addTag":
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
        break;
      case "fetchAvatar":
        avatarManager.fetchAvatarImage(msg.email, msg.repo, msg.commits);
        break;
      case "checkoutBranch":
        bridge.post({
          command: "checkoutBranch",
          status: await dataSource.checkoutBranch(msg.repo, msg.branchName, msg.remoteBranch)
        });
        break;
      case "checkoutCommit":
        bridge.post({
          command: "checkoutCommit",
          status: await dataSource.checkoutCommit(msg.repo, msg.commitHash)
        });
        break;
      case "cherrypickCommit":
        bridge.post({
          command: "cherrypickCommit",
          status: await dataSource.cherrypickCommit(msg.repo, msg.commitHash, msg.parentIndex)
        });
        break;
      case "commitDetails":
        bridge.post({
          command: "commitDetails",
          commitDetails: await dataSource.commitDetails(msg.repo, msg.commitHash)
        });
        break;
      case "copyToClipboard":
        bridge.post({
          command: "copyToClipboard",
          type: msg.type,
          success: await copyToClipboard(msg.data)
        });
        break;
      case "createBranch":
        bridge.post({
          command: "createBranch",
          status: await dataSource.createBranch(msg.repo, msg.branchName, msg.commitHash)
        });
        break;
      case "deleteBranch":
        bridge.post({
          command: "deleteBranch",
          status: await dataSource.deleteBranch(msg.repo, msg.branchName, msg.forceDelete)
        });
        break;
      case "deleteTag":
        bridge.post({
          command: "deleteTag",
          status: await dataSource.deleteTag(msg.repo, msg.tagName)
        });
        break;
      case "selectRepo":
        if (msg.repo === getCurrentRepo()) break;
        gitManager.setRepo(msg.repo);
        setCurrentRepo(msg.repo);
        extensionState.setLastActiveRepo(msg.repo);
        repoFileWatcher.start(msg.repo);
        break;
      case "loadBranches": {
        let branchData = await gitManager.get().branch.list(msg.showRemoteBranches),
          isRepo = true;
        if (branchData.error) {
          isRepo = await dataSource.isGitRepository(getCurrentRepo()!);
        }
        bridge.post({
          command: "loadBranches",
          branches: branchData.branches,
          head: branchData.head,
          hard: msg.hard,
          isRepo: isRepo
        });
        break;
      }
      case "loadCommits":
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
        break;
      case "loadRepos":
        if (!msg.check || !(await repoManager.checkReposExist())) {
          respondLoadRepos(repoManager.getRepos(), extensionState.getLastActiveRepo(), bridge);
        }
        break;
      case "mergeBranch":
        bridge.post({
          command: "mergeBranch",
          status: await dataSource.mergeBranch(msg.repo, msg.branchName, msg.createNewCommit)
        });
        break;
      case "mergeCommit":
        bridge.post({
          command: "mergeCommit",
          status: await dataSource.mergeCommit(msg.repo, msg.commitHash, msg.createNewCommit)
        });
        break;
      case "pushTag":
        bridge.post({
          command: "pushTag",
          status: await dataSource.pushTag(msg.repo, msg.tagName)
        });
        break;
      case "renameBranch":
        bridge.post({
          command: "renameBranch",
          status: await dataSource.renameBranch(msg.repo, msg.oldName, msg.newName)
        });
        break;
      case "resetToCommit":
        bridge.post({
          command: "resetToCommit",
          status: await dataSource.resetToCommit(msg.repo, msg.commitHash, msg.resetMode)
        });
        break;
      case "revertCommit":
        bridge.post({
          command: "revertCommit",
          status: await dataSource.revertCommit(msg.repo, msg.commitHash, msg.parentIndex)
        });
        break;
      case "saveRepoState":
        repoManager.setRepoState(msg.repo, msg.state);
        break;
      case "viewDiff":
        bridge.post({
          command: "viewDiff",
          success: await viewDiff(
            msg.repo,
            msg.commitHash,
            msg.oldFilePath,
            msg.newFilePath,
            msg.type
          )
        });
        break;
    }
    repoFileWatcher.unmute();
  };
}
