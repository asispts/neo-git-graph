import * as vscode from "vscode";

/**
 * Localized strings for the webview (main.ts, dropdown.ts).
 * The webview cannot access vscode.l10n directly, so the strings are resolved
 * here in the extension host and injected into the page as the global `l10n`
 * object (see webviewHtml.ts). Every user-facing webview string must be
 * declared here — `@vscode/l10n-dev export` extracts them from this file.
 */
export function getWebviewLocalizedStrings() {
  return {
    // UI labels
    repo: vscode.l10n.t("Repo"),
    branch: vscode.l10n.t("Branch"),
    loading: vscode.l10n.t("Loading ..."),
    loadMore: vscode.l10n.t("Load More Commits"),
    showAll: vscode.l10n.t("Show All"),
    filterPlaceholder: vscode.l10n.t("Filter {0}..."),
    noResultsFound: vscode.l10n.t("No results found."),
    graph: vscode.l10n.t("Graph"),
    description: vscode.l10n.t("Description"),
    date: vscode.l10n.t("Date"),
    author: vscode.l10n.t("Author"),
    commit: vscode.l10n.t("Commit"),

    // Error messages
    unableToLoadCommitDetails: vscode.l10n.t("Unable to load commit details"),
    unableToCopyToClipboard: vscode.l10n.t("Unable to Copy {0} to Clipboard"),
    unableToViewDiff: vscode.l10n.t("Unable to view diff of file"),
    unableToAddTag: vscode.l10n.t("Unable to Add Tag"),
    unableToCheckoutBranch: vscode.l10n.t("Unable to Checkout Branch"),
    unableToCheckoutCommit: vscode.l10n.t("Unable to Checkout Commit"),
    unableToCherryPick: vscode.l10n.t("Unable to Cherry Pick Commit"),
    unableToCreateBranch: vscode.l10n.t("Unable to Create Branch"),
    unableToDeleteBranch: vscode.l10n.t("Unable to Delete Branch"),
    unableToDeleteTag: vscode.l10n.t("Unable to Delete Tag"),
    unableToMergeBranch: vscode.l10n.t("Unable to Merge Branch"),
    unableToMergeCommit: vscode.l10n.t("Unable to Merge Commit"),
    unableToPushTag: vscode.l10n.t("Unable to Push Tag"),
    unableToRenameBranch: vscode.l10n.t("Unable to Rename Branch"),
    unableToReset: vscode.l10n.t("Unable to Reset to Commit"),
    unableToRevert: vscode.l10n.t("Unable to Revert Commit"),
    invalidCharacters: vscode.l10n.t("Unable to {0}, one or more invalid characters entered."),

    // Actions
    addTag: vscode.l10n.t("Add Tag"),
    createBranch: vscode.l10n.t("Create Branch"),
    checkout: vscode.l10n.t("Checkout"),
    cherryPick: vscode.l10n.t("Cherry Pick"),
    revert: vscode.l10n.t("Revert"),
    merge: vscode.l10n.t("Merge into current branch"),
    reset: vscode.l10n.t("Reset current branch to this Commit"),
    copyCommitHash: vscode.l10n.t("Copy Commit Hash to Clipboard"),
    copyTagName: vscode.l10n.t("Copy Tag Name to Clipboard"),
    copyBranchName: vscode.l10n.t("Copy Branch Name to Clipboard"),
    deleteTag: vscode.l10n.t("Delete Tag"),
    pushTag: vscode.l10n.t("Push Tag"),
    checkoutBranch: vscode.l10n.t("Checkout Branch"),
    renameBranch: vscode.l10n.t("Rename Branch"),
    deleteBranch: vscode.l10n.t("Delete Branch"),

    typeCommitHash: vscode.l10n.t("Commit Hash"),
    typeTagName: vscode.l10n.t("Tag Name"),
    typeBranchName: vscode.l10n.t("Branch Name"),

    // label
    labelTag: vscode.l10n.t("the tag"),
    labelBranch: vscode.l10n.t("the branch"),
    labelCurrentBranch: vscode.l10n.t("the current branch"),

    // Dialog
    dialogAddTagTitle: vscode.l10n.t("Add tag to commit {0}"),
    dialogAddTagName: vscode.l10n.t("Name"),
    dialogAddTagType: vscode.l10n.t("Type"),
    dialogAddTagMessage: vscode.l10n.t("Message"),
    dialogAddTagTypeAnnotated: vscode.l10n.t("Annotated"),
    dialogAddTagTypeLightweight: vscode.l10n.t("Lightweight"),
    dialogAddTagOptional: vscode.l10n.t("Optional"),
    dialogAddTagSubmit: vscode.l10n.t("Add Tag"),
    dialogCreateBranchTitle: vscode.l10n.t("Enter the name of the branch {0}"),
    dialogCreateBranchSubmit: vscode.l10n.t("Create Branch"),
    dialogCheckoutConfirm: vscode.l10n.t(
      "Are you sure you want to checkout commit {0}? This will result in a 'detached HEAD' state."
    ),
    dialogCherryPickConfirm: vscode.l10n.t("Are you sure you want to cherry pick commit {0}?"),
    dialogRevertConfirm: vscode.l10n.t("Are you sure you want to revert commit {0}?"),
    dialogMergeConfirm: vscode.l10n.t("Are you sure you want to merge {0} into {1}?"),
    dialogMergeNoFastForward: vscode.l10n.t("Create a new commit even if fast-forward is possible"),
    dialogResetConfirm: vscode.l10n.t("Are you sure you want to reset {0} to commit {1}?"),
    dialogResetSoft: vscode.l10n.t("Soft - Keep all changes, but reset head"),
    dialogResetMixed: vscode.l10n.t("Mixed - Keep working tree, but reset index"),
    dialogResetHard: vscode.l10n.t("Hard - Discard all changes"),
    dialogDeleteConfirm: vscode.l10n.t("Are you sure you want to delete {0} {1}?"),
    dialogDeleteForceDelete: vscode.l10n.t("Force Delete"),
    dialogRenameBranchTitle: vscode.l10n.t("Enter the new name for the branch {0}:"),
    dialogRenameBranchSubmit: vscode.l10n.t("Rename Branch"),
    dialogPushTagConfirm: vscode.l10n.t("Are you sure you want to push the tag {0}?"),
    dialogYes: vscode.l10n.t("Yes"),
    dialogYesCherryPick: vscode.l10n.t("Yes, cherry pick commit"),
    dialogYesRevert: vscode.l10n.t("Yes, revert commit"),
    dialogYesMerge: vscode.l10n.t("Yes, merge"),
    dialogYesReset: vscode.l10n.t("Yes, reset"),
    dialogCancel: vscode.l10n.t("Cancel"),
    dialogDismiss: vscode.l10n.t("Dismiss"),

    // Status
    pushingTag: vscode.l10n.t("Pushing Tag"),

    // Relative commit dates are formatted by Intl.RelativeTimeFormat in the
    // webview (see utils/date.ts), so no time units are declared here.

    // Commit details ({0} is the value; the text before it is rendered bold)
    detailCommit: vscode.l10n.t("Commit: {0}"),
    detailParents: vscode.l10n.t("Parents: {0}"),
    detailAuthor: vscode.l10n.t("Author: {0}"),
    detailDate: vscode.l10n.t("Date: {0}"),
    detailCommitter: vscode.l10n.t("Committer: {0}"),

    uncommittedChanges: vscode.l10n.t("Uncommitted Changes ({0})"),

    // File tooltips
    tooltipBinaryFile: vscode.l10n.t("This is a binary file, unable to view diff."),
    tooltipRenamedTo: vscode.l10n.t("{0} was renamed to {1}"),
    tooltipAddition: vscode.l10n.t("{0} addition"),
    tooltipAdditions: vscode.l10n.t("{0} additions"),
    tooltipDeletion: vscode.l10n.t("{0} deletion"),
    tooltipDeletions: vscode.l10n.t("{0} deletions")
  };
}

export type LocalizedStrings = ReturnType<typeof getWebviewLocalizedStrings>;
