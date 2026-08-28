import * as vscode from "vscode";

import { checkoutBranch, createBranch, deleteBranch, renameBranch } from "@/backend/actions/branch";
import {
  checkoutCommit,
  cherrypickCommit,
  resetToCommit,
  revertCommit
} from "@/backend/actions/commit";
import { mergeBranch, mergeCommit } from "@/backend/actions/merge";
import { addTag, deleteTag, pushTag } from "@/backend/actions/tag";
import { GitClient } from "@/backend/gitClient";
import { commitDetails } from "@/backend/queries/commitDetails";
import { loadBranches } from "@/backend/queries/loadBranches";
import { loadCommits } from "@/backend/queries/loadCommits";
import { GitFileChangeType } from "@/backend/types";
import { abbrevCommit } from "@/backend/utils/string";
import { AvatarManager } from "@/old-extension/avatarManager";
import { Config } from "@/old-extension/config";
import { encodeDiffDocUri } from "@/old-extension/diffDocProvider";
import { ExtensionState } from "@/old-extension/extensionState";
import { RepoFileWatcher } from "@/old-extension/repoFileWatcher";
import { RequestMessage, ResponseMessage } from "@/types";

import { RepoManager } from "./repoManager";
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
      ? vscode.l10n.t("Added in {0}", abbrevHash)
      : type === "D"
        ? vscode.l10n.t("Deleted in {0}", abbrevHash)
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
    config: Config;
    gitClient: GitClient;
    repoManager: RepoManager;
    extensionState: ExtensionState;
    avatarManager: AvatarManager;
    repoFileWatcher: RepoFileWatcher;
  }
) {
  const { config, gitClient, repoManager, extensionState, avatarManager, repoFileWatcher } = deps;

  let currentRepo: string | null = null;

  function setCurrentRepo(repo: string) {
    if (repo === currentRepo) {
      return;
    }
    currentRepo = repo;
    gitClient.setRepo(repo);
    extensionState.setLastActiveRepo(repo);
    repoFileWatcher.start(repo);
  }

  function registerAction<T extends RequestMessage["command"]>(
    command: T,
    handler: (msg: Extract<RequestMessage, { command: T }>) => Promise<void>
  ) {
    bridge.onMessage(command, async (msg) => {
      let status: string | null = null;
      try {
        await handler(msg);
      } catch (e: unknown) {
        status = e instanceof Error ? e.message : String(e);
      }
      bridge.post({ command, status } as ResponseMessage);
    });
  }

  // --- Action handlers ---

  registerAction("addTag", (msg) => addTag(gitClient.getInstance(), msg));
  registerAction("deleteTag", (msg) => deleteTag(gitClient.getInstance(), msg));
  registerAction("pushTag", (msg) => pushTag(gitClient.getInstance(), msg));
  registerAction("createBranch", (msg) => createBranch(gitClient.getInstance(), msg));
  registerAction("deleteBranch", (msg) => deleteBranch(gitClient.getInstance(), msg));
  registerAction("renameBranch", (msg) => renameBranch(gitClient.getInstance(), msg));
  registerAction("checkoutBranch", (msg) => checkoutBranch(gitClient.getInstance(), msg));
  registerAction("checkoutCommit", (msg) => checkoutCommit(gitClient.getInstance(), msg));
  registerAction("cherrypickCommit", (msg) => cherrypickCommit(gitClient.getInstance(), msg));
  registerAction("revertCommit", (msg) => revertCommit(gitClient.getInstance(), msg));
  registerAction("resetToCommit", (msg) => resetToCommit(gitClient.getInstance(), msg));
  registerAction("mergeBranch", (msg) => mergeBranch(gitClient.getInstance(), msg));
  registerAction("mergeCommit", (msg) => mergeCommit(gitClient.getInstance(), msg));

  // --- Query handlers ---

  bridge.onMessage("loadCommits", async (msg) => {
    setCurrentRepo(msg.repo);
    bridge.post({
      command: "loadCommits",
      repo: msg.repo,
      branchName: msg.branchName,
      ...(await loadCommits(gitClient.getInstance(), {
        branchName: msg.branchName,
        maxCommits: msg.maxCommits,
        showRemoteBranches: msg.showRemoteBranches,
        hard: msg.hard,
        dateType: config.dateType(),
        showUncommittedChanges: config.showUncommittedChanges()
      }))
    });
  });

  bridge.onMessage("loadBranches", async (msg) => {
    setCurrentRepo(msg.repo);
    bridge.post({
      command: "loadBranches",
      ...(await loadBranches(gitClient.getInstance(), {
        showRemoteBranches: msg.showRemoteBranches,
        hard: msg.hard,
        repo: msg.repo,
        gitPath: config.gitPath()
      }))
    });
  });

  bridge.onMessage("commitDetails", async (msg) => {
    bridge.post({
      command: "commitDetails",
      ...(await commitDetails(gitClient.getInstance(), {
        commitHash: msg.commitHash,
        dateType: config.dateType()
      }))
    });
  });

  // --- Infrastructure handlers ---

  bridge.onMessage("selectRepo", (msg) => {
    setCurrentRepo(msg.repo);
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

  bridge.onMessage("fetchAvatar", (msg) => {
    avatarManager.fetchAvatarImage(msg.email, msg.repo, msg.commits);
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

  return {
    onPanelShown: () => {
      currentRepo = null;
    }
  };
}
