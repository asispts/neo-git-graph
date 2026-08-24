import type { ComponentChildren } from "preact";

import type { GitCommitNode, GitRef, GitResetMode } from "@/backend/types";
import { abbrevCommit } from "@/backend/utils/string";
import {
  copyToClipboard,
  openFormDialog,
  openRunningDialog,
  runAction
} from "@/webview/lib/actions";
import type { ContextMenuEntry } from "@/webview/types";
import { format } from "@/webview/utils/format";

/** Commit message of every loaded commit, by hash. It labels the parents of a merge. */
export type CommitMessages = ReadonlyMap<string, string>;

/**
 * Keys that tell a commit row or a ref label that its own menu is open.
 * A ref name is unique per type, so the pair identifies one label.
 */
export function commitMenuSource(hash: string) {
  return `commit:${hash}`;
}

export function refMenuSource(gitRef: GitRef) {
  return `ref:${gitRef.type}:${gitRef.name}`;
}

/** A hash or a ref name, as the dialogs show it. */
function Name({ children }: { children: string }) {
  return (
    <b>
      <i>{children}</i>
    </b>
  );
}

function CurrentBranch() {
  return <b>{window.l10n.labelCurrentBranch}</b>;
}

/** One line per parent, so the user can tell which side of a merge to take. */
function parentOptions(commit: GitCommitNode, messages: CommitMessages) {
  return commit.parentHashes.map((hash, index) => {
    const message = messages.get(hash);
    return {
      label: message === undefined ? abbrevCommit(hash) : `${abbrevCommit(hash)}: ${message}`,
      value: String(index + 1)
    };
  });
}

/**
 * Ask before a command that takes one parent of a commit. A merge has more than
 * one parent, so the user must pick the side to apply.
 */
function confirmOnParent(options: {
  command: "cherrypickCommit" | "revertCommit";
  message: ComponentChildren;
  action: string;
  commit: GitCommitNode;
  messages: CommitMessages;
  source: string;
}) {
  const { command, message, action, commit, messages, source } = options;

  if (commit.parentHashes.length < 2) {
    openFormDialog({
      message,
      inputs: [],
      action,
      source,
      onSubmit: () => runAction({ command, commitHash: commit.hash, parentIndex: 0 })
    });
    return;
  }

  openFormDialog({
    message,
    inputs: [{ kind: "select", value: "1", options: parentOptions(commit, messages) }],
    action,
    source,
    onSubmit: ([parentIndex]) =>
      runAction({ command, commitHash: commit.hash, parentIndex: Number(parentIndex) })
  });
}

export function commitMenu(
  commit: GitCommitNode,
  messages: CommitMessages
): Array<ContextMenuEntry> {
  const hash = commit.hash;
  const source = commitMenuSource(hash);
  const shortHash = abbrevCommit(hash);

  return [
    {
      title: `${window.l10n.addTag}…`,
      onClick: () =>
        openFormDialog({
          message: format(window.l10n.dialogAddTagTitle, <Name>{shortHash}</Name>),
          inputs: [
            { kind: "ref", label: window.l10n.dialogAddTagName, value: "" },
            {
              kind: "select",
              label: window.l10n.dialogAddTagType,
              value: "annotated",
              options: [
                { label: window.l10n.dialogAddTagTypeAnnotated, value: "annotated" },
                { label: window.l10n.dialogAddTagTypeLightweight, value: "lightweight" }
              ]
            },
            {
              kind: "text",
              label: window.l10n.dialogAddTagMessage,
              value: "",
              placeholder: window.l10n.dialogAddTagOptional
            }
          ],
          action: window.l10n.dialogAddTagSubmit,
          source,
          onSubmit: ([tagName, type, message]) =>
            runAction({
              command: "addTag",
              tagName,
              commitHash: hash,
              lightweight: type === "lightweight",
              message
            })
        })
    },
    {
      title: `${window.l10n.createBranch}…`,
      onClick: () =>
        openFormDialog({
          message: format(window.l10n.dialogCreateBranchTitle, <Name>{shortHash}</Name>),
          inputs: [{ kind: "ref", value: "" }],
          action: window.l10n.dialogCreateBranchSubmit,
          source,
          onSubmit: ([branchName]) =>
            runAction({ command: "createBranch", branchName, commitHash: hash })
        })
    },
    null,
    {
      title: `${window.l10n.checkout}…`,
      onClick: () =>
        openFormDialog({
          message: format(window.l10n.dialogCheckoutConfirm, <Name>{shortHash}</Name>),
          inputs: [],
          action: window.l10n.dialogYes,
          source,
          onSubmit: () => runAction({ command: "checkoutCommit", commitHash: hash })
        })
    },
    {
      title: `${window.l10n.cherryPick}…`,
      onClick: () =>
        confirmOnParent({
          command: "cherrypickCommit",
          message: format(window.l10n.dialogCherryPickConfirm, <Name>{shortHash}</Name>),
          action: window.l10n.dialogYesCherryPick,
          commit,
          messages,
          source
        })
    },
    {
      title: `${window.l10n.revert}…`,
      onClick: () =>
        confirmOnParent({
          command: "revertCommit",
          message: format(window.l10n.dialogRevertConfirm, <Name>{shortHash}</Name>),
          action: window.l10n.dialogYesRevert,
          commit,
          messages,
          source
        })
    },
    null,
    {
      title: `${window.l10n.merge}…`,
      onClick: () =>
        openFormDialog({
          message: format(
            window.l10n.dialogMergeConfirm,
            <Name>{shortHash}</Name>,
            <CurrentBranch />
          ),
          inputs: [{ kind: "checkbox", label: window.l10n.dialogMergeNoFastForward, value: true }],
          action: window.l10n.dialogYesMerge,
          source,
          onSubmit: ([createNewCommit]) =>
            runAction({ command: "mergeCommit", commitHash: hash, createNewCommit })
        })
    },
    {
      title: `${window.l10n.reset}…`,
      onClick: () =>
        openFormDialog({
          message: format(
            window.l10n.dialogResetConfirm,
            <CurrentBranch />,
            <Name>{shortHash}</Name>
          ),
          inputs: [
            {
              kind: "select",
              value: "mixed",
              options: [
                { label: window.l10n.dialogResetSoft, value: "soft" },
                { label: window.l10n.dialogResetMixed, value: "mixed" },
                { label: window.l10n.dialogResetHard, value: "hard" }
              ]
            }
          ],
          action: window.l10n.dialogYesReset,
          source,
          onSubmit: ([resetMode]) =>
            runAction({
              command: "resetToCommit",
              commitHash: hash,
              resetMode: resetMode as GitResetMode
            })
        })
    },
    null,
    {
      title: window.l10n.copyCommitHash,
      onClick: () => copyToClipboard(window.l10n.typeCommitHash, hash)
    }
  ];
}

/**
 * Check out a branch. A local branch is checked out as it is. A remote branch
 * needs a name for the local branch that tracks it.
 */
export function checkoutBranchAction(gitRef: GitRef) {
  if (gitRef.type === "head") {
    runAction({ command: "checkoutBranch", branchName: gitRef.name, remoteBranch: null });
    return;
  }

  if (gitRef.type !== "remote") {
    return;
  }

  openFormDialog({
    message: format(window.l10n.dialogCreateBranchTitle, <Name>{gitRef.name}</Name>),
    inputs: [{ kind: "ref", value: gitRef.name.split("/").findLast(Boolean) ?? gitRef.name }],
    action: window.l10n.checkoutBranch,
    source: refMenuSource(gitRef),
    onSubmit: ([branchName]) =>
      runAction({ command: "checkoutBranch", branchName, remoteBranch: gitRef.name })
  });
}

function tagMenu(gitRef: GitRef): Array<ContextMenuEntry> {
  const source = refMenuSource(gitRef);

  return [
    {
      title: `${window.l10n.deleteTag}…`,
      onClick: () =>
        openFormDialog({
          message: format(
            window.l10n.dialogDeleteConfirm,
            window.l10n.labelTag,
            <Name>{gitRef.name}</Name>
          ),
          inputs: [],
          action: window.l10n.dialogYes,
          source,
          onSubmit: () => runAction({ command: "deleteTag", tagName: gitRef.name })
        })
    },
    {
      title: `${window.l10n.pushTag}…`,
      onClick: () =>
        openFormDialog({
          message: format(window.l10n.dialogPushTagConfirm, <Name>{gitRef.name}</Name>),
          inputs: [],
          action: window.l10n.dialogYes,
          source,
          onSubmit: () => {
            runAction({ command: "pushTag", tagName: gitRef.name });
            openRunningDialog(window.l10n.pushingTag);
          }
        })
    },
    null,
    {
      title: window.l10n.copyTagName,
      onClick: () => copyToClipboard(window.l10n.typeTagName, gitRef.name)
    }
  ];
}

function localBranchMenu(gitRef: GitRef, isHeadBranch: boolean): Array<ContextMenuEntry> {
  const source = refMenuSource(gitRef);
  const entries: Array<ContextMenuEntry> = [];

  if (!isHeadBranch) {
    entries.push({
      title: window.l10n.checkoutBranch,
      onClick: () => checkoutBranchAction(gitRef)
    });
  }

  entries.push({
    title: `${window.l10n.renameBranch}…`,
    onClick: () =>
      openFormDialog({
        message: format(window.l10n.dialogRenameBranchTitle, <Name>{gitRef.name}</Name>),
        inputs: [{ kind: "ref", value: gitRef.name }],
        action: window.l10n.dialogRenameBranchSubmit,
        source,
        onSubmit: ([newName]) =>
          runAction({ command: "renameBranch", oldName: gitRef.name, newName })
      })
  });

  if (!isHeadBranch) {
    entries.push(
      {
        title: `${window.l10n.deleteBranch}…`,
        onClick: () =>
          openFormDialog({
            message: format(
              window.l10n.dialogDeleteConfirm,
              window.l10n.labelBranch,
              <Name>{gitRef.name}</Name>
            ),
            inputs: [
              { kind: "checkbox", label: window.l10n.dialogDeleteForceDelete, value: false }
            ],
            action: window.l10n.deleteBranch,
            source,
            onSubmit: ([forceDelete]) =>
              runAction({ command: "deleteBranch", branchName: gitRef.name, forceDelete })
          })
      },
      {
        title: `${window.l10n.merge}…`,
        onClick: () =>
          openFormDialog({
            message: format(
              window.l10n.dialogMergeConfirm,
              <Name>{gitRef.name}</Name>,
              <CurrentBranch />
            ),
            inputs: [
              { kind: "checkbox", label: window.l10n.dialogMergeNoFastForward, value: true }
            ],
            action: window.l10n.dialogYesMerge,
            source,
            onSubmit: ([createNewCommit]) =>
              runAction({ command: "mergeBranch", branchName: gitRef.name, createNewCommit })
          })
      }
    );
  }

  entries.push(null, {
    title: window.l10n.copyBranchName,
    onClick: () => copyToClipboard(window.l10n.typeBranchName, gitRef.name)
  });

  return entries;
}

function remoteBranchMenu(gitRef: GitRef): Array<ContextMenuEntry> {
  return [
    {
      title: `${window.l10n.checkoutBranch}…`,
      onClick: () => checkoutBranchAction(gitRef)
    },
    null,
    {
      title: window.l10n.copyBranchName,
      onClick: () => copyToClipboard(window.l10n.typeBranchName, gitRef.name)
    }
  ];
}

/** `isHeadBranch` tells that this ref is the branch that is checked out. */
export function refMenu(gitRef: GitRef, isHeadBranch: boolean): Array<ContextMenuEntry> {
  if (gitRef.type === "tag") {
    return tagMenu(gitRef);
  }

  if (gitRef.type === "head") {
    return localBranchMenu(gitRef, isHeadBranch);
  }

  return remoteBranchMenu(gitRef);
}
