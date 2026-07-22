/**
 * Source of truth for all user-facing runtime strings.
 *
 * - Message IDs are stable identifiers used by the extension host via t("id")
 *   (see ./l10n.ts) and exposed to the webview as the global `l10n` object
 *   (see ./webviewL10n.ts). Do not rename IDs without checking both consumers.
 * - The message ID is the translation key in l10n/bundle.l10n.*.json; the
 *   English text below is the fallback used when a bundle has no entry for
 *   the ID (see ./l10n.ts). Editing English text never invalidates existing
 *   translations.
 * - Entries appear in the same order as l10n/bundle.l10n.json.
 *
 * After editing this file, run `pnpm l10n:sync` to regenerate
 * l10n/bundle.l10n.json, then translate the new/changed keys in the locale
 * bundles. `pnpm l10n:check` (CI) verifies everything is in sync.
 */
export const messages = {
  // UI labels
  viewGitGraph: "View Git Graph",
  repo: "Repo",
  branch: "Branch",
  showRemoteBranches: "Show Remote Branches",
  refresh: "Refresh",
  loading: "Loading ...",
  loadMore: "Load More Commits",
  showAll: "Show All",
  filterPlaceholder: "Filter {0}...",
  noResultsFound: "No results found.",
  graph: "Graph",
  description: "Description",
  date: "Date",
  author: "Author",
  commit: "Commit",

  // Startup errors
  unableToLoadGitGraph: "Unable to load Git Graph",
  noGitRepository:
    "Either the current workspace does not contain a Git repository, or the Git repository is not configured correctly.",
  noGit:
    'If you are using a portable Git installation, make sure you have set the Visual Studio Code Setting "git.path" to the path of your portable installation (e.g. "C:\\Program Files\\Git\\bin\\git.exe" on Windows).',

  // Actions
  addTag: "Add Tag",
  createBranch: "Create Branch",
  checkout: "Checkout",
  cherryPick: "Cherry Pick",
  revert: "Revert",
  merge: "Merge into current branch",
  reset: "Reset current branch to this Commit",
  copyCommitHash: "Copy Commit Hash to Clipboard",
  copyTagName: "Copy Tag Name to Clipboard",
  copyBranchName: "Copy Branch Name to Clipboard",
  deleteTag: "Delete Tag",
  pushTag: "Push Tag",
  checkoutBranch: "Checkout Branch",
  renameBranch: "Rename Branch",
  deleteBranch: "Delete Branch",

  // Ref labels (sentence fragments)
  labelTag: "the tag",
  labelBranch: "the branch",
  labelCurrentBranch: "the current branch",

  // Dialogs
  dialogAddTagTitle: "Add tag to commit {0}",
  dialogAddTagName: "Name",
  dialogAddTagType: "Type",
  dialogAddTagMessage: "Message",
  dialogAddTagTypeAnnotated: "Annotated",
  dialogAddTagTypeLightweight: "Lightweight",
  dialogAddTagOptional: "Optional",
  dialogAddTagSubmit: "Add Tag",
  dialogCreateBranchTitle: "Enter the name of the branch {0}",
  dialogCreateBranchSubmit: "Create Branch",
  dialogCheckoutConfirm:
    "Are you sure you want to checkout commit {0}? This will result in a 'detached HEAD' state.",
  dialogCherryPickConfirm: "Are you sure you want to cherry pick commit {0}?",
  dialogRevertConfirm: "Are you sure you want to revert commit {0}?",
  dialogMergeConfirm: "Are you sure you want to merge {0} into {1}?",
  dialogMergeNoFastForward: "Create a new commit even if fast-forward is possible",
  dialogResetConfirm: "Are you sure you want to reset {0} to commit {1}?",
  dialogResetSoft: "Soft - Keep all changes, but reset head",
  dialogResetMixed: "Mixed - Keep working tree, but reset index",
  dialogResetHard: "Hard - Discard all changes",
  dialogDeleteConfirm: "Are you sure you want to delete {0} {1}?",
  dialogDeleteForceDelete: "Force Delete",
  dialogRenameBranchTitle: "Enter the new name for the branch {0}:",
  dialogRenameBranchSubmit: "Rename Branch",
  dialogPushTagConfirm: "Are you sure you want to push the tag {0}?",
  dialogYes: "Yes",
  dialogYesCherryPick: "Yes, cherry pick commit",
  dialogYesRevert: "Yes, revert commit",
  dialogYesMerge: "Yes, merge",
  dialogYesReset: "Yes, reset",
  dialogCancel: "Cancel",
  dialogDismiss: "Dismiss",

  // Errors
  unableToLoadCommitDetails: "Unable to load commit details",
  typeCommitHash: "Commit Hash",
  typeTagName: "Tag Name",
  typeBranchName: "Branch Name",
  unableToCopyToClipboard: "Unable to Copy {0} to Clipboard",
  unableToViewDiff: "Unable to view diff of file",
  unableToAddTag: "Unable to Add Tag",
  unableToCheckoutBranch: "Unable to Checkout Branch",
  unableToCheckoutCommit: "Unable to Checkout Commit",
  unableToCherryPick: "Unable to Cherry Pick Commit",
  unableToCreateBranch: "Unable to Create Branch",
  unableToDeleteBranch: "Unable to Delete Branch",
  unableToDeleteTag: "Unable to Delete Tag",
  unableToMergeBranch: "Unable to Merge Branch",
  unableToMergeCommit: "Unable to Merge Commit",
  unableToPushTag: "Unable to Push Tag",
  unableToRenameBranch: "Unable to Rename Branch",
  unableToReset: "Unable to Reset to Commit",
  unableToRevert: "Unable to Revert Commit",
  invalidCharacters: "Unable to {0}, one or more invalid characters entered.",

  // Status
  pushingTag: "Pushing Tag",

  // Time
  // @FIXME(legacy): a boolean flag smuggled through l10n ("true"/"false"), not a display string
  timeNeedFormatMonth: "true",
  // @FIXME(legacy): a date format spec smuggled through l10n, not a display string
  timeDateFormat: "DD MM YYYY",
  timeSecond: "second",
  timeMinute: "minute",
  timeHour: "hour",
  timeDay: "day",
  timeWeek: "week",
  timeMonth: "month",
  timeYear: "year",
  timeAgo: "ago",
  timeSeconds: "seconds",
  timeMinutes: "minutes",
  timeHours: "hours",
  timeDays: "days",
  timeWeeks: "weeks",
  timeMonths: "months",
  timeYears: "years",

  // Month abbreviations (empty translation = fall back to English)
  monthJan: "Jan",
  monthFeb: "Feb",
  monthMar: "Mar",
  monthApr: "Apr",
  monthMay: "May",
  monthJun: "Jun",
  monthJul: "Jul",
  monthAug: "Aug",
  monthSep: "Sep",
  monthOct: "Oct",
  monthNov: "Nov",
  monthDec: "Dec",

  // Diff view titles
  diffAddedIn: "Added in {0}",
  diffDeletedIn: "Deleted in {0}",

  // Commit details (trailing whitespace is significant)
  detailCommit: "Commit: ",
  detailParents: "Parents: ",
  detailAuthor: "Author: ",
  detailDate: "Date: ",
  detailCommitter: "Committer: ",

  uncommittedChanges: "Uncommitted Changes ({0})",

  // File tooltips (leading/trailing whitespace is significant)
  tooltipBinaryFile: "This is a binary file, unable to view diff.",
  tooltipRenamedTo: " was renamed to ",
  tooltipAddition: " addition",
  tooltipAdditions: " additions",
  tooltipDeletion: " deletion",
  tooltipDeletions: " deletions"
} as const;

export type MessageId = keyof typeof messages;
