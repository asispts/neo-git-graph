import type { DateFormat, GraphStyle } from "./types";

export type WebviewConfig = Readonly<{
  autoCenterCommitDetailsView: boolean;
  dateFormat: DateFormat;
  fetchAvatars: boolean;
  graphColours: readonly string[];
  graphStyle: GraphStyle;
  initialLoadCommits: number;
  loadMoreCommits: number;
  /** VS Code display language (vscode.env.language), used for Intl date formatting */
  locale: string;
  showCurrentBranchByDefault: boolean;
}>;
