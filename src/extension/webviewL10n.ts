import * as l10n from "../l10n";

/**
 * Get all localized strings for the webview.
 * Since webview cannot access vscode.l10n directly, we need to pass the strings
 * from the extension context.
 */
export function getWebviewLocalizedStrings() {
  return {
    // UI labels
    repo: l10n.t("ui.repo"),
    branch: l10n.t("ui.branch"),
    showRemoteBranches: l10n.t("ui.showRemoteBranches"),
    refresh: l10n.t("ui.refresh"),
    locateHead: l10n.t("ui.locateHead"),
    loading: l10n.t("ui.loading"),
    loadMore: l10n.t("ui.loadMore"),
    showAll: l10n.t("ui.showAll"),
    filterPlaceholder: l10n.t("ui.filterPlaceholder"),
    noResultsFound: l10n.t("ui.noResultsFound"),
    graph: l10n.t("ui.graph"),
    description: l10n.t("ui.description"),
    date: l10n.t("ui.date"),
    author: l10n.t("ui.author"),
    commit: l10n.t("ui.commit"),

    // Error messages
    unableToLoadGitGraph: l10n.t("error.unableToLoadGitGraph"),
    noGitRepository: l10n.t("error.noGitRepository"),
    noGit: l10n.t("error.noGit"),
    unableToLoadCommitDetails: l10n.t("error.unableToLoadCommitDetails"),
    unableToCopyToClipboard: l10n.t("error.unableToCopyToClipboard"),
    unableToViewDiff: l10n.t("error.unableToViewDiff"),
    unableToAddTag: l10n.t("error.unableToAddTag"),
    unableToCheckoutBranch: l10n.t("error.unableToCheckoutBranch"),
    unableToCheckoutCommit: l10n.t("error.unableToCheckoutCommit"),
    unableToCherryPick: l10n.t("error.unableToCherryPick"),
    unableToCreateBranch: l10n.t("error.unableToCreateBranch"),
    unableToDeleteBranch: l10n.t("error.unableToDeleteBranch"),
    unableToDeleteTag: l10n.t("error.unableToDeleteTag"),
    unableToMergeBranch: l10n.t("error.unableToMergeBranch"),
    unableToMergeCommit: l10n.t("error.unableToMergeCommit"),
    unableToPushTag: l10n.t("error.unableToPushTag"),
    unableToRenameBranch: l10n.t("error.unableToRenameBranch"),
    unableToReset: l10n.t("error.unableToReset"),
    unableToRevert: l10n.t("error.unableToRevert"),
    invalidCharacters: l10n.t("error.invalidCharacters"),

    // Actions
    addTag: l10n.t("action.addTag"),
    createBranch: l10n.t("action.createBranch"),
    checkout: l10n.t("action.checkout"),
    cherryPick: l10n.t("action.cherryPick"),
    revert: l10n.t("action.revert"),
    merge: l10n.t("action.merge"),
    reset: l10n.t("action.reset"),
    copyCommitHash: l10n.t("action.copyCommitHash"),
    copyCommitSubject: l10n.t("action.copyCommitSubject"),
    deleteTag: l10n.t("action.deleteTag"),
    pushTag: l10n.t("action.pushTag"),
    checkoutBranch: l10n.t("action.checkoutBranch"),
    renameBranch: l10n.t("action.renameBranch"),
    deleteBranch: l10n.t("action.deleteBranch"),
    mergeBranch: l10n.t("action.mergeBranch"),

    // label
    labelTag: l10n.t("label.tag"),
    labelBranch: l10n.t("label.branch"),
    labelCurrentBranch: l10n.t("label.currentBranch"),

    // Dialog
    dialogAddTagTitle: l10n.t("dialog.addTag.title"),
    dialogAddTagName: l10n.t("dialog.addTag.name"),
    dialogAddTagType: l10n.t("dialog.addTag.type"),
    dialogAddTagMessage: l10n.t("dialog.addTag.message"),
    dialogAddTagTypeAnnotated: l10n.t("dialog.addTag.typeAnnotated"),
    dialogAddTagTypeLightweight: l10n.t("dialog.addTag.typeLightweight"),
    dialogAddTagOptional: l10n.t("dialog.addTag.optional"),
    dialogAddTagSubmit: l10n.t("dialog.addTag.submit"),
    dialogCreateBranchTitle: l10n.t("dialog.createBranch.title"),
    dialogCreateBranchSubmit: l10n.t("dialog.createBranch.submit"),
    dialogCheckoutConfirm: l10n.t("dialog.checkout.confirm"),
    dialogCherryPickConfirm: l10n.t("dialog.cherryPick.confirm"),
    dialogRevertConfirm: l10n.t("dialog.revert.confirm"),
    dialogMergeConfirm: l10n.t("dialog.merge.confirm"),
    dialogMergeNoFastForward: l10n.t("dialog.merge.noFastForward"),
    dialogResetConfirm: l10n.t("dialog.reset.confirm"),
    dialogResetSoft: l10n.t("dialog.reset.soft"),
    dialogResetMixed: l10n.t("dialog.reset.mixed"),
    dialogResetHard: l10n.t("dialog.reset.hard"),
    dialogDeleteConfirm: l10n.t("dialog.delete.confirm"),
    dialogDeleteForceDelete: l10n.t("dialog.delete.forceDelete"),
    dialogRenameBranchTitle: l10n.t("dialog.renameBranch.title"),
    dialogRenameBranchSubmit: l10n.t("dialog.renameBranch.submit"),
    dialogPushTagConfirm: l10n.t("dialog.push.tag.confirm"),
    dialogYes: l10n.t("dialog.yes"),
    dialogYesCherryPick: l10n.t("dialog.yesCherryPick"),
    dialogYesRevert: l10n.t("dialog.yesRevert"),
    dialogYesMerge: l10n.t("dialog.yesMerge"),
    dialogYesReset: l10n.t("dialog.yesReset"),
    dialogCancel: l10n.t("dialog.cancel"),
    dialogDismiss: l10n.t("dialog.dismiss"),

    // Status
    pushingTag: l10n.t("status.pushingTag"),

    // Time
    timeNeedFormatMonth: l10n.t("time.needFormatMonth"),
    timeDateFormat: l10n.t("time.dateformat"),
    timeSecond: l10n.t("time.second"),
    timeMinute: l10n.t("time.minute"),
    timeHour: l10n.t("time.hour"),
    timeDay: l10n.t("time.day"),
    timeWeek: l10n.t("time.week"),
    timeMonth: l10n.t("time.month"),
    timeYear: l10n.t("time.year"),
    timeAgo: l10n.t("time.ago"),
    timeSeconds: l10n.t("time.seconds"),
    timeMinutes: l10n.t("time.minutes"),
    timeHours: l10n.t("time.hours"),
    timeDays: l10n.t("time.days"),
    timeWeeks: l10n.t("time.weeks"),
    timeMonths: l10n.t("time.months"),
    timeYears: l10n.t("time.years"),

    // Months
    monthJan: l10n.t("month.jan"),
    monthFeb: l10n.t("month.feb"),
    monthMar: l10n.t("month.mar"),
    monthApr: l10n.t("month.apr"),
    monthMay: l10n.t("month.may"),
    monthJun: l10n.t("month.jun"),
    monthJul: l10n.t("month.jul"),
    monthAug: l10n.t("month.aug"),
    monthSep: l10n.t("month.sep"),
    monthOct: l10n.t("month.oct"),
    monthNov: l10n.t("month.nov"),
    monthDec: l10n.t("month.dec")
  };
}

export type LocalizedStrings = ReturnType<typeof getWebviewLocalizedStrings>;
