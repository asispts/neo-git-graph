import type { ComponentChildren } from "preact";

import type { ActionRequest, GitFileChange } from "@/backend/types";

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

/**
 * One field of a dialog form. `value` is the field's initial value.
 * A field without a `label` is named by the message of the dialog.
 */
export type DialogInput =
  | { kind: "text"; label?: string; value: string; placeholder?: string }
  | { kind: "ref"; label?: string; value: string }
  | {
      kind: "select";
      label?: string;
      value: string;
      options: Array<{ label: string; value: string }>;
    }
  | { kind: "checkbox"; label: string; value: boolean };

/** What one input hands back on submit. Only a checkbox gives a boolean. */
type DialogInputValue<I> = I extends { kind: "checkbox" } ? boolean : string;

/** What a whole form hands back on submit: one value per input, in order. */
export type DialogValues<T extends ReadonlyArray<DialogInput>> = {
  [K in keyof T]: DialogInputValue<T[K]>;
};

export type DialogBody =
  | {
      kind: "form";
      message: ComponentChildren;
      inputs: Array<DialogInput>;
      /** Label of the button that submits the form. */
      action: string;
      onSubmit: (values: Array<string | boolean>) => void;
      /** Context menu key of the element the dialog belongs to, or `null`. */
      source: string | null;
    }
  | { kind: "running"; message: string }
  | { kind: "error"; message: string; reason: string | null };

/** Adds the field to every member of a union, so it stays discriminated. */
type WithToken<T> = T extends unknown ? T & { token: number } : never;

/** `token` is bumped per dialog, so a new form starts from its own values. */
export type DialogState = WithToken<DialogBody>;

/** Drops a key from every member of a union, instead of from the union itself. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An `ActionRequest` before `lib/actions.ts` fills in the selected repo. */
export type ActionCommand = DistributiveOmit<ActionRequest, "repo">;

/** A git action the user confirmed. `lib/sync.ts` sends it to the editor. */
export type ActionRequestState = {
  action: ActionRequest;
  /** Bumped per request, so that running the same action twice is sent twice. */
  token: number;
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
