import type { GitCommitNode, GitRef } from "@/backend/types";
import { abbrevCommit } from "@/backend/utils/string";
import { RefLabel } from "@/webview/components/commit/RefLabel";
import { UNCOMMITTED_CHANGES } from "@/webview/constants";
import { openContextMenu } from "@/webview/lib/actions";
import type { CommitMessages } from "@/webview/lib/menus";
import { commitMenu, commitMenuSource } from "@/webview/lib/menus";
import { activeSource, uncommittedChanges } from "@/webview/lib/stores";
import { getCommitDate } from "@/webview/utils/date";
import { format } from "@/webview/utils/format";

type CommitRowProps = {
  commit: GitCommitNode;
  isHead: boolean;
  headBranch: string | null;
  /** Commit messages by hash, so the menu can name the parents of a merge. */
  messages: CommitMessages;
  /** Colour of the graph branch this commit sits on. */
  colour: string | undefined;
  /** The details view of this commit is open. */
  expanded: boolean;
  /** Open or close the details view. Absent for the uncommitted changes row. */
  onSelect: (() => void) | undefined;
};

const CELL_CLASS = "h-[24px] overflow-hidden text-ellipsis whitespace-nowrap px-1 leading-[24px]";

function isActiveRef(gitRef: GitRef, headBranch: string | null) {
  return gitRef.type === "head" && gitRef.name === headBranch;
}

/** The checked out branch is shown first, the remaining refs keep their order. */
function orderRefs(refs: Array<GitRef>, headBranch: string | null) {
  return refs.toSorted(
    (a, b) => Number(isActiveRef(b, headBranch)) - Number(isActiveRef(a, headBranch))
  );
}

/** One background per state. Two unprefixed `bg-*` classes would race on CSS order. */
function rowBackground(isHead: boolean, expanded: boolean, menuOpen: boolean) {
  if (expanded) {
    return "bg-row-selected hover:bg-row-selected-hover";
  }
  if (menuOpen) {
    return "bg-row-hover";
  }
  if (isHead) {
    return "bg-row-head hover:bg-row-hover";
  }
  return "hover:bg-row-hover";
}

function rowClass(isHead: boolean, expanded: boolean, selectable: boolean, menuOpen: boolean) {
  return [rowBackground(isHead, expanded, menuOpen), selectable ? "cursor-pointer" : ""]
    .filter(Boolean)
    .join(" ");
}

export function CommitRow({
  commit,
  isHead,
  headBranch,
  messages,
  colour,
  expanded,
  onSelect
}: CommitRowProps) {
  const uncommitted = commit.hash === UNCOMMITTED_CHANGES;
  const message = uncommitted
    ? format(window.l10n.uncommittedChanges, uncommittedChanges.value)
    : commit.message;
  const date = getCommitDate(commit.date);
  const source = commitMenuSource(commit.hash);
  const menuOpen = activeSource.value === source;

  return (
    <tr
      class={rowClass(isHead, expanded, onSelect !== undefined, menuOpen)}
      style={colour === undefined ? undefined : `--color-graph: ${colour}`}
      onClick={onSelect}
      onContextMenu={
        uncommitted
          ? undefined
          : (event) => openContextMenu(event, source, commitMenu(commit, messages))
      }
    >
      <td class={CELL_CLASS} />
      <td
        class={`${CELL_CLASS} w-full max-w-0 pl-2.5 ${
          isHead ? "shadow-[inset_2px_0_0_var(--color-graph)]" : ""
        }`}
      >
        {isHead && (
          <span class="mt-[7px] mr-[5px] inline-block size-[6px] box-content rounded-full border-2 border-graph align-top" />
        )}
        {orderRefs(commit.refs, headBranch).map((gitRef) => (
          <RefLabel
            key={`${gitRef.type}-${gitRef.name}`}
            gitRef={gitRef}
            active={isActiveRef(gitRef, headBranch)}
          />
        ))}
        {isHead || uncommitted ? <b>{message}</b> : message}
      </td>
      <td class={CELL_CLASS} title={date.title}>
        {date.value}
      </td>
      <td class={`${CELL_CLASS} max-w-[124px]`} title={`${commit.author} <${commit.email}>`}>
        {commit.author}
      </td>
      <td class={`${CELL_CLASS} font-mono`} title={commit.hash}>
        {abbrevCommit(commit.hash)}
      </td>
    </tr>
  );
}
