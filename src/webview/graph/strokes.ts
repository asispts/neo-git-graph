import { ROW_HEIGHT } from "@/webview/constants";
import type { GraphBranch, GraphStroke } from "@/webview/graph/types";
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

function placeLines(branch: GraphBranch): Array<PlacedLine> {
  const lines = branch.lines.map((line) => ({
    x1: laneX(line.p1.x),
    y1: rowY(line.p1.y),
    x2: laneX(line.p2.x),
    y2: rowY(line.p2.y),
    isCommitted: line.isCommitted,
    lockedFirst: line.lockedFirst
  }));

  // Join consecutive vertical lines into one, so the path stays short.
  for (let i = 0; i < lines.length - 1;) {
    const line = lines[i];
    const next = lines[i + 1];
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
export function branchStrokes(branch: GraphBranch, angular: boolean): Array<GraphStroke> {
  const lines = placeLines(branch);
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
