import { ROW_HEIGHT } from "@/webview/constants";
import { LANE_OFFSET, LANE_WIDTH } from "@/webview/graph/constants";
import type { Branch, GraphLayout, GraphPoint, Vertex } from "@/webview/graph/types";

/** Centre of a lane, in pixels. */
export function laneX(x: number): number {
  return x * LANE_WIDTH + LANE_OFFSET;
}

/** Centre of a commit row, in pixels. */
export function rowY(y: number): number {
  return y * ROW_HEIGHT + ROW_HEIGHT / 2;
}

export function graphWidth(layout: GraphLayout): number {
  return layout.lanes * LANE_WIDTH;
}

export function graphHeight(layout: GraphLayout): number {
  return layout.vertices.length * ROW_HEIGHT;
}

/** Where the vertex sits, once it is on a branch. */
export function pointOf(vertex: Vertex): GraphPoint {
  return { x: vertex.x, y: vertex.y };
}

/** First point of the row that no line uses yet. */
export function nextPointOf(vertex: Vertex): GraphPoint {
  return { x: vertex.nextX, y: vertex.y };
}

/** The point that already connects this vertex to `connectsTo`, if there is one. */
export function connectionTo(
  vertex: Vertex,
  connectsTo: Vertex | null,
  onBranch: Branch
): GraphPoint | null {
  const x = vertex.connections.findIndex(
    (connection) => connection.connectsTo === connectsTo && connection.onBranch === onBranch
  );
  return x === -1 ? null : { x, y: vertex.y };
}

/** Take a point of this row, so that no later line reuses it. */
export function takePoint(
  vertex: Vertex,
  x: number,
  connectsTo: Vertex | null,
  onBranch: Branch
): void {
  if (x === vertex.nextX) {
    vertex.nextX = x + 1;
    vertex.connections[x] = { connectsTo, onBranch };
  }
}

/** A vertex joins the first branch that reaches it, and keeps it. */
export function joinBranch(vertex: Vertex, branch: Branch, x: number): void {
  if (vertex.branch === null) {
    vertex.branch = branch;
    vertex.x = x;
  }
}
