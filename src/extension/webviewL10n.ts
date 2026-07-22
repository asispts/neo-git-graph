import { l10n } from "vscode";

/**
 * Get all localized strings for the webview.
 * Since webview cannot access vscode.l10n directly, we need to pass the strings
 * from the extension context.
 */
export function getWebviewLocalizedStrings() {
  return {
    // UI labels
    repo: l10n.t("Repo"),
    branch: l10n.t("Branch"),
    showRemoteBranches: l10n.t("Show Remote Branches"),
    refresh: l10n.t("Refresh"),
    loading: l10n.t("Loading ..."),
    loadMore: l10n.t("Load More Commits"),
    showAll: l10n.t("Show All"),
    filterPlaceholder: l10n.t("Filter {0}..."),
    noResultsFound: l10n.t("No results found."),
    graph: l10n.t("Graph"),
    description: l10n.t("Description"),
    date: l10n.t("Date"),
    author: l10n.t("Author"),
    commit: l10n.t("Commit"),

    // Error messages
    unableToLoadGitGraph: l10n.t("Unable to load Git Graph"),
    noGitRepository: l10n.t(
      "Either the current workspace does not contain a Git repository, or the Git repository is not configured correctly."
    ),
    noGit: l10n.t(
      'If you are using a portable Git installation, make sure you have set the Visual Studio Code Setting "git.path" to the path of your portable installation (e.g. "C:\\Program Files\\Git\\bin\\git.exe" on Windows).'
    ),
    unableToLoadCommitDetails: l10n.t("Unable to load commit details"),
    unableToCopyToClipboard: l10n.t("Unable to Copy {0} to Clipboard"),
    unableToViewDiff: l10n.t("Unable to view diff of file"),
    unableToAddTag: l10n.t("Unable to Add Tag"),
    unableToCheckoutBranch: l10n.t("Unable to Checkout Branch"),
    unableToCheckoutCommit: l10n.t("Unable to Checkout Commit"),
    unableToCherryPick: l10n.t("Unable to Cherry Pick Commit"),
    unableToCreateBranch: l10n.t("Unable to Create Branch"),
    unableToDeleteBranch: l10n.t("Unable to Delete Branch"),
    unableToDeleteTag: l10n.t("Unable to Delete Tag"),
    unableToMergeBranch: l10n.t("Unable to Merge Branch"),
    unableToMergeCommit: l10n.t("Unable to Merge Commit"),
    unableToPushTag: l10n.t("Unable to Push Tag"),
    unableToRenameBranch: l10n.t("Unable to Rename Branch"),
    unableToReset: l10n.t("Unable to Reset to Commit"),
    unableToRevert: l10n.t("Unable to Revert Commit"),
    invalidCharacters: l10n.t("Unable to {0}, one or more invalid characters entered."),

    // Actions
    addTag: l10n.t("Add Tag"),
    createBranch: l10n.t("Create Branch"),
    checkout: l10n.t("Checkout"),
    cherryPick: l10n.t("Cherry Pick"),
    revert: l10n.t("Revert"),
    merge: l10n.t("Merge into current branch"),
    reset: l10n.t("Reset current branch to this Commit"),
    copyCommitHash: l10n.t("Copy Commit Hash to Clipboard"),
    copyTagName: l10n.t("Copy Tag Name to Clipboard"),
    copyBranchName: l10n.t("Copy Branch Name to Clipboard"),
    deleteTag: l10n.t("Delete Tag"),
    pushTag: l10n.t("Push Tag"),
    checkoutBranch: l10n.t("Checkout Branch"),
    renameBranch: l10n.t("Rename Branch"),
    deleteBranch: l10n.t("Delete Branch"),

    typeCommitHash: l10n.t("Commit Hash"),
    typeTagName: l10n.t("Tag Name"),
    typeBranchName: l10n.t("Branch Name"),

    // label
    labelTag: l10n.t("the tag"),
    labelBranch: l10n.t("the branch"),
    labelCurrentBranch: l10n.t("the current branch"),

    // Dialog
    dialogAddTagTitle: l10n.t("Add tag to commit {0}"),
    dialogAddTagName: l10n.t("Name"),
    dialogAddTagType: l10n.t("Type"),
    dialogAddTagMessage: l10n.t("Message"),
    dialogAddTagTypeAnnotated: l10n.t("Annotated"),
    dialogAddTagTypeLightweight: l10n.t("Lightweight"),
    dialogAddTagOptional: l10n.t("Optional"),
    dialogAddTagSubmit: l10n.t("Add Tag"),
    dialogCreateBranchTitle: l10n.t("Enter the name of the branch {0}"),
    dialogCreateBranchSubmit: l10n.t("Create Branch"),
    dialogCheckoutConfirm: l10n.t(
      "Are you sure you want to checkout commit {0}? This will result in a 'detached HEAD' state."
    ),
    dialogCherryPickConfirm: l10n.t("Are you sure you want to cherry pick commit {0}?"),
    dialogRevertConfirm: l10n.t("Are you sure you want to revert commit {0}?"),
    dialogMergeConfirm: l10n.t("Are you sure you want to merge {0} into {1}?"),
    dialogMergeNoFastForward: l10n.t("Create a new commit even if fast-forward is possible"),
    dialogResetConfirm: l10n.t("Are you sure you want to reset {0} to commit {1}?"),
    dialogResetSoft: l10n.t("Soft - Keep all changes, but reset head"),
    dialogResetMixed: l10n.t("Mixed - Keep working tree, but reset index"),
    dialogResetHard: l10n.t("Hard - Discard all changes"),
    dialogDeleteConfirm: l10n.t("Are you sure you want to delete {0} {1}?"),
    dialogDeleteForceDelete: l10n.t("Force Delete"),
    dialogRenameBranchTitle: l10n.t("Enter the new name for the branch {0}:"),
    dialogRenameBranchSubmit: l10n.t("Rename Branch"),
    dialogPushTagConfirm: l10n.t("Are you sure you want to push the tag {0}?"),
    dialogYes: l10n.t("Yes"),
    dialogYesCherryPick: l10n.t("Yes, cherry pick commit"),
    dialogYesRevert: l10n.t("Yes, revert commit"),
    dialogYesMerge: l10n.t("Yes, merge"),
    dialogYesReset: l10n.t("Yes, reset"),
    dialogCancel: l10n.t("Cancel"),
    dialogDismiss: l10n.t("Dismiss"),

    // Status
    pushingTag: l10n.t("Pushing Tag"),

    // Time
    timeNeedFormatMonth: l10n.t("true"),
    timeDateFormat: l10n.t("DD MM YYYY"),
    timeSecond: l10n.t("second"),
    timeMinute: l10n.t("minute"),
    timeHour: l10n.t("hour"),
    timeDay: l10n.t("day"),
    timeWeek: l10n.t("week"),
    timeMonth: l10n.t("month"),
    timeYear: l10n.t("year"),
    timeAgo: l10n.t("ago"),
    timeSeconds: l10n.t("seconds"),
    timeMinutes: l10n.t("minutes"),
    timeHours: l10n.t("hours"),
    timeDays: l10n.t("days"),
    timeWeeks: l10n.t("weeks"),
    timeMonths: l10n.t("months"),
    timeYears: l10n.t("years"),

    // Months
    monthJan: l10n.t("Jan"),
    monthFeb: l10n.t("Feb"),
    monthMar: l10n.t("Mar"),
    monthApr: l10n.t("Apr"),
    monthMay: l10n.t("May"),
    monthJun: l10n.t("Jun"),
    monthJul: l10n.t("Jul"),
    monthAug: l10n.t("Aug"),
    monthSep: l10n.t("Sep"),
    monthOct: l10n.t("Oct"),
    monthNov: l10n.t("Nov"),
    monthDec: l10n.t("Dec"),

    detailCommit: l10n.t("Commit: "),
    detailParents: l10n.t("Parents: "),
    detailAuthor: l10n.t("Author: "),
    detailDate: l10n.t("Date: "),
    detailCommitter: l10n.t("Committer: "),

    uncommittedChanges: l10n.t("Uncommitted Changes ({0})"),

    tooltipBinaryFile: l10n.t("This is a binary file, unable to view diff."),
    tooltipRenamedTo: l10n.t(" was renamed to "),
    tooltipAddition: l10n.t(" addition"),
    tooltipAdditions: l10n.t(" additions"),
    tooltipDeletion: l10n.t(" deletion"),
    tooltipDeletions: l10n.t(" deletions")
  };
}

export type LocalizedStrings = ReturnType<typeof getWebviewLocalizedStrings>;
