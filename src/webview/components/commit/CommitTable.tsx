import { Fragment } from "preact";
import { useMemo } from "preact/hooks";

import type { GitCommitNode } from "@/backend/types";
import { CommitDetails } from "@/webview/components/commit/CommitDetails";
import { CommitGraph } from "@/webview/components/commit/CommitGraph";
import { CommitRow } from "@/webview/components/commit/CommitRow";
import { COMMIT_DETAILS_HEIGHT, UNCOMMITTED_CHANGES } from "@/webview/constants";
import { GRAPH_PADDING } from "@/webview/graph/constants";
import { computeGraphLayout } from "@/webview/graph/layout";
import { branchColour } from "@/webview/graph/palette";
import type { GraphExpansion } from "@/webview/graph/types";
import { graphWidth } from "@/webview/graph/utils";
import { toggleCommitDetails } from "@/webview/lib/actions";
import { commitDetails, expandedCommit } from "@/webview/lib/stores";

type CommitTableProps = {
  commits: Array<GitCommitNode>;
  head: string | null;
  headBranch: string | null;
};

const HEADER_CLASS = "h-[32px] border-b border-line px-3 text-left font-semibold";

/** Keep room for the graph, and for the column title when the graph is narrow. */
const MIN_GRAPH_COLUMN = 64;

export function CommitTable({ commits, head, headBranch }: CommitTableProps) {
  const layout = useMemo(() => computeGraphLayout(commits, head), [commits, head]);
  const graphColumn = Math.max(graphWidth(layout) + GRAPH_PADDING, MIN_GRAPH_COLUMN);

  const expandedHash = expandedCommit.value;
  const expandedRow = commits.findIndex((commit) => commit.hash === expandedHash);
  const expansion: GraphExpansion | null =
    expandedRow === -1 ? null : { row: expandedRow, height: COMMIT_DETAILS_HEIGHT };

  return (
    <div class="relative">
      <CommitGraph layout={layout} expansion={expansion} />
      <table class="w-full cursor-default border-collapse text-[13px] select-none">
        <thead>
          <tr>
            <th class={HEADER_CLASS} style={`width: ${graphColumn}px`}>
              {window.l10n.graph}
            </th>
            <th class={HEADER_CLASS}>{window.l10n.description}</th>
            <th class={HEADER_CLASS}>{window.l10n.date}</th>
            <th class={HEADER_CLASS}>{window.l10n.author}</th>
            <th class={HEADER_CLASS}>{window.l10n.commit}</th>
          </tr>
        </thead>
        <tbody>
          {commits.map((commit, index) => (
            <Fragment key={commit.hash}>
              <CommitRow
                commit={commit}
                isHead={commit.hash === head}
                headBranch={headBranch}
                colour={branchColour(layout.vertices[index].colour)}
                expanded={index === expandedRow}
                onSelect={
                  commit.hash === UNCOMMITTED_CHANGES
                    ? undefined
                    : () => toggleCommitDetails(commit.hash)
                }
              />
              {index === expandedRow && <CommitDetails details={commitDetails.value} />}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
