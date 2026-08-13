import type { GitCommitNode, GitRef } from "@/backend/types";
import { abbrevCommit } from "@/backend/utils/string";
import { RefLabel } from "@/webview/components/commit/RefLabel";
import { UNCOMMITTED_CHANGES } from "@/webview/constants";
import { getCommitDate } from "@/webview/utils/date";

type CommitRowProps = {
  commit: GitCommitNode;
  isHead: boolean;
  headBranch: string | null;
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

function rowClass(isHead: boolean, expanded: boolean, selectable: boolean) {
  return [
    expanded ? "bg-row-selected hover:bg-row-selected-hover" : "hover:bg-row-hover",
    isHead && !expanded ? "bg-row-head" : "",
    selectable ? "cursor-pointer" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function CommitRow({
  commit,
  isHead,
  headBranch,
  colour,
  expanded,
  onSelect
}: CommitRowProps) {
  const uncommitted = commit.hash === UNCOMMITTED_CHANGES;
  const date = getCommitDate(commit.date);

  return (
    <tr
      class={rowClass(isHead, expanded, onSelect !== undefined)}
      style={colour === undefined ? undefined : `--color-graph: ${colour}`}
      onClick={onSelect}
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
        {isHead || uncommitted ? <b>{commit.message}</b> : commit.message}
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
