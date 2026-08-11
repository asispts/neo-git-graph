import { useMemo } from "preact/hooks";

import type { GitCommitNode } from "@/backend/types";
import { CommitGraph } from "@/webview/components/commit/CommitGraph";
import { CommitRow } from "@/webview/components/commit/CommitRow";
import { GRAPH_PADDING } from "@/webview/graph/constants";
import { computeGraphLayout } from "@/webview/graph/layout";
import { branchColour } from "@/webview/graph/palette";
import { graphWidth } from "@/webview/graph/utils";

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

  return (
    <div class="relative">
      <CommitGraph layout={layout} />
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
            <CommitRow
              key={commit.hash}
              commit={commit}
              isHead={commit.hash === head}
              headBranch={headBranch}
              colour={branchColour(layout.vertices[index].colour)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
