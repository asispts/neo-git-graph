import type { ComponentChildren, RefObject } from "preact";
import { useEffect, useMemo, useRef } from "preact/hooks";

import type { GitCommitDetails } from "@/backend/types";
import { FileTree } from "@/webview/components/commit/FileTree";
import { Icon } from "@/webview/components/ui/Icons";
import { Loading } from "@/webview/components/ui/Loading";
import { COMMIT_DETAILS_HEIGHT, ROW_HEIGHT } from "@/webview/constants";
import { closeCommitDetails } from "@/webview/lib/actions";
import { getFullDate } from "@/webview/utils/date";
import { buildFileTree } from "@/webview/utils/fileTree";

/** Gap kept between the details view and the edge of the window, in pixels. */
const SCROLL_GAP = 8;

/** Height of the line that closes the view off, in pixels. */
const SEPARATOR_HEIGHT = 2;

/** Scroll the details view into view, the way the user configured it. */
function useScrollIntoView(row: RefObject<HTMLTableRowElement>) {
  useEffect(() => {
    if (row.current === null) {
      return;
    }

    const box = row.current.getBoundingClientRect();

    if (viewState.autoCenterCommitDetailsView) {
      window.scrollBy({ top: box.top + box.height / 2 - window.innerHeight / 2 });
      return;
    }

    // Keep the commit row above the details view visible as well.
    const above = box.top - ROW_HEIGHT - SCROLL_GAP;
    if (above < 0) {
      window.scrollBy({ top: above });
    } else if (box.bottom + SCROLL_GAP > window.innerHeight) {
      window.scrollBy({ top: box.bottom + SCROLL_GAP - window.innerHeight });
    }
  }, [row]);
}

/** One "Label: {0}" row of the summary, with the label in bold. */
function DetailRow({ template, children }: { template: string; children: ComponentChildren }) {
  const [label, after = ""] = template.split("{0}");

  return (
    <div class="truncate">
      <b>{label}</b>
      {children}
      {after}
    </div>
  );
}

function Summary({ details }: { details: GitCommitDetails }) {
  return (
    <div class="w-9/20 shrink-0 overflow-auto border-x border-line p-2.5 select-text">
      <DetailRow template={window.l10n.detailCommit}>{details.hash}</DetailRow>
      <DetailRow template={window.l10n.detailParents}>{details.parents.join(", ")}</DetailRow>
      <DetailRow template={window.l10n.detailAuthor}>
        {details.author} &lt;
        <a class="text-inherit underline" href={`mailto:${encodeURIComponent(details.email)}`}>
          {details.email}
        </a>
        &gt;
      </DetailRow>
      <DetailRow template={window.l10n.detailDate}>{getFullDate(details.date)}</DetailRow>
      <DetailRow template={window.l10n.detailCommitter}>{details.committer}</DetailRow>
      <p class="mt-4 whitespace-pre-wrap">{details.body}</p>
    </div>
  );
}

/**
 * The details of one commit, shown as a row of the commit table under the
 * commit it belongs to. Its height is fixed, because the graph is drawn to it.
 */
export function CommitDetails({ details }: { details: GitCommitDetails | null }) {
  const row = useRef<HTMLTableRowElement>(null);
  useScrollIntoView(row);

  const nodes = useMemo(
    () => (details === null ? [] : buildFileTree(details.fileChanges)),
    [details]
  );

  return (
    <tr ref={row} style={`height: ${COMMIT_DETAILS_HEIGHT}px`}>
      <td />
      <td
        colSpan={4}
        class="relative bg-btn p-0 align-top text-ui leading-4.5 whitespace-normal after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-line"
      >
        <div
          class="overflow-hidden"
          style={`height: ${COMMIT_DETAILS_HEIGHT - SEPARATOR_HEIGHT}px`}
        >
          {details === null ? (
            <Loading />
          ) : (
            <div class="flex h-full">
              <Summary details={details} />
              {/* The right margin keeps the scrollbar clear of the close button. */}
              <div class="mr-8 grow overflow-x-hidden overflow-y-scroll border-r border-line py-1">
                <FileTree nodes={nodes} commitHash={details.hash} />
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          class="absolute top-1 right-1 cursor-pointer opacity-60 hover:opacity-100"
          title={window.l10n.close}
          aria-label={window.l10n.close}
          onClick={closeCommitDetails}
        >
          <Icon class="size-6" viewBox="0 0 12 16">
            <path d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z" />
          </Icon>
        </button>
      </td>
    </tr>
  );
}
