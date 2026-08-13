import type { GitFileChange } from "@/backend/types";

export type CommitBranchType = "*" | (string & {});

/** One clickable row of a context menu. `null` renders a divider. */
export type ContextMenuEntry = { title: string; onClick: () => void } | null;

export type ContextMenuState = {
  /** Viewport coordinates of the click that opened the menu. */
  x: number;
  y: number;
  entries: Array<ContextMenuEntry>;
  /** Identifies the element the menu belongs to, so that element can highlight itself. */
  source: string;
};

/** Text the user asked to put on the clipboard. `type` names it in error messages. */
export type ClipboardRequest = {
  type: string;
  data: string;
  /** Bumped per request, so that copying the same text twice is sent twice. */
  token: number;
};

/** A file diff the user asked to open in the editor. */
export type DiffRequest = {
  repo: string;
  commitHash: string;
  file: GitFileChange;
  /** Bumped per request, so that opening one file twice is sent twice. */
  token: number;
};
