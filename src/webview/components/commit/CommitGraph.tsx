import { VERTEX_RADIUS } from "@/webview/graph/constants";
import { branchColour, UNCOMMITTED_COLOUR } from "@/webview/graph/palette";
import { branchStrokes } from "@/webview/graph/strokes";
import type { GraphExpansion, GraphLayout } from "@/webview/graph/types";
import { expandOffset, graphHeight, graphWidth, laneX, rowY } from "@/webview/graph/utils";

const SHADOW_CLASS = "fill-none stroke-editor/75 stroke-4";
const LINE_CLASS = "fill-none stroke-2";
const HEAD_DOT_CLASS = "fill-editor stroke-2";
const DOT_CLASS = "stroke-editor/75 stroke-1";

/**
 * The branch lines and commit dots, drawn behind the first column of the commit
 * table. The table rows set the scale: a row is `ROW_HEIGHT` high. The caller
 * places the graph, and cuts it off when the column is too narrow for it.
 */
export function CommitGraph({
  layout,
  expansion
}: {
  layout: GraphLayout;
  expansion: GraphExpansion | null;
}) {
  const angular = viewState.graphStyle === "angular";
  const strokes = layout.branches.flatMap((branch) => branchStrokes(branch, angular, expansion));

  return (
    <svg
      class="block"
      width={graphWidth(layout)}
      height={graphHeight(layout, expansion)}
      aria-hidden="true"
    >
      {strokes.map((stroke, index) => (
        <g key={index}>
          <path class={SHADOW_CLASS} d={stroke.path} />
          <path
            class={LINE_CLASS}
            d={stroke.path}
            stroke={stroke.isCommitted ? branchColour(stroke.colour) : UNCOMMITTED_COLOUR}
          />
        </g>
      ))}
      {layout.vertices.map((vertex) => {
        const colour = vertex.isCommitted ? branchColour(vertex.colour) : UNCOMMITTED_COLOUR;

        return (
          <circle
            key={vertex.y}
            cx={laneX(vertex.x)}
            cy={rowY(vertex.y) + expandOffset(vertex.y, expansion)}
            r={VERTEX_RADIUS}
            class={vertex.isCurrent ? HEAD_DOT_CLASS : DOT_CLASS}
            stroke={vertex.isCurrent ? colour : undefined}
            fill={vertex.isCurrent ? undefined : colour}
          />
        );
      })}
    </svg>
  );
}
