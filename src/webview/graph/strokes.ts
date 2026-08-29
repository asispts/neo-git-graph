import { ROW_HEIGHT } from "@/webview/constants";
import type { GraphBranch, GraphExpansion, GraphLine, GraphStroke } from "@/webview/graph/types";
import { laneX, rowY } from "@/webview/graph/utils";

/** A branch line converted to pixels. */
type PlacedLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isCommitted: boolean;
  lockedFirst: boolean;
};

/**
 * Convert one line to pixels. A line below the open commit details view moves
 * down by its height; a line that crosses the view is stretched over it, which
 * takes a second line when the line also changes lane.
 */
function placeLine(line: GraphLine, expansion: GraphExpansion | null): Array<PlacedLine> {
  const x1 = laneX(line.p1.x);
  const x2 = laneX(line.p2.x);
  const y1 = rowY(line.p1.y);
  const y2 = rowY(line.p2.y);
  const rest = { isCommitted: line.isCommitted, lockedFirst: line.lockedFirst };

  if (expansion === null || line.p2.y <= expansion.row) {
    return [{ x1, y1, x2, y2, ...rest }];
  }

  const height = expansion.height;
  if (line.p1.y > expansion.row) {
    return [{ x1, y1: y1 + height, x2, y2: y2 + height, ...rest }];
  }

  if (x1 === x2) {
    return [{ x1, y1, x2, y2: y2 + height, ...rest }];
  }

  // The corner of a lane change keeps its row, so the line is split into the
  // lane change itself, and a straight line that spans the view.
  if (line.lockedFirst) {
    return [
      { x1, y1, x2, y2, ...rest },
      { x1: x2, y1: y1 + ROW_HEIGHT, x2, y2: y2 + height, ...rest }
    ];
  }
  return [
    { x1, y1, x2: x1, y2: y2 - ROW_HEIGHT + height, ...rest },
    { x1, y1: y1 + height, x2, y2: y2 + height, ...rest }
  ];
}

function placeLines(branch: GraphBranch, expansion: GraphExpansion | null): Array<PlacedLine> {
  const lines = branch.lines.flatMap((line) => placeLine(line, expansion));

  // Join consecutive vertical lines into one, so the path stays short.
  for (let i = 0; i < lines.length - 1;) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line === undefined || next === undefined) {
      break;
    }
    const straight =
      line.x1 === line.x2 &&
      line.x2 === next.x1 &&
      next.x1 === next.x2 &&
      line.y2 === next.y1 &&
      line.isCommitted === next.isCommitted;

    if (straight) {
      line.y2 = next.y2;
      lines.splice(i + 1, 1);
    } else {
      i++;
    }
  }

  return lines;
}

/**
 * Build the SVG paths of a branch. A branch breaks into more than one path
 * where it changes between committed and uncommitted, because the two are
 * drawn in different colours.
 */
export function branchStrokes(
  branch: GraphBranch,
  angular: boolean,
  expansion: GraphExpansion | null
): Array<GraphStroke> {
  const lines = placeLines(branch, expansion);
  const corner = ROW_HEIGHT * (angular ? 0.38 : 0.8);

  const strokes: Array<GraphStroke> = [];
  let path = "";
  let isCommitted = true;

  const flush = () => {
    if (path !== "") {
      strokes.push({ path, colour: branch.colour, isCommitted });
      path = "";
    }
  };

  lines.forEach((line, i) => {
    const previous = lines[i - 1];

    if (previous !== undefined && line.isCommitted !== previous.isCommitted) {
      flush();
    }

    if (path === "") {
      isCommitted = line.isCommitted;
    }

    if (
      path === "" ||
      (previous !== undefined && (line.x1 !== previous.x2 || line.y1 !== previous.y2))
    ) {
      path += `M${line.x1.toFixed(0)},${line.y1.toFixed(1)}`;
    }

    if (line.x1 === line.x2) {
      path += `L${line.x2.toFixed(0)},${line.y2.toFixed(1)}`;
      return;
    }

    if (angular) {
      const corner1 = line.lockedFirst
        ? `${line.x2.toFixed(0)},${(line.y2 - corner).toFixed(1)}`
        : `${line.x1.toFixed(0)},${(line.y1 + corner).toFixed(1)}`;
      path += `L${corner1}L${line.x2.toFixed(0)},${line.y2.toFixed(1)}`;
      return;
    }

    path +=
      `C${line.x1.toFixed(0)},${(line.y1 + corner).toFixed(1)}` +
      ` ${line.x2.toFixed(0)},${(line.y2 - corner).toFixed(1)}` +
      ` ${line.x2.toFixed(0)},${line.y2.toFixed(1)}`;
  });

  flush();
  return strokes;
}
