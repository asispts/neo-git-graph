/**
 * Shapes of the commit graph. A point is a grid cell, not a pixel: `x` is a
 * lane, `y` is the index of the commit in the list.
 */

export type GraphPoint = { x: number; y: number };

export type GraphLine = {
  p1: GraphPoint;
  p2: GraphPoint;
  isCommitted: boolean;
  /** The corner of a lane change sits at the start of the line, not its end. */
  lockedFirst: boolean;
};

export type GraphBranch = {
  colour: number;
  lines: Array<GraphLine>;
};

export type GraphVertex = {
  x: number;
  y: number;
  colour: number;
  isCommitted: boolean;
  /** The commit HEAD points at, drawn as an open circle. */
  isCurrent: boolean;
};

export type GraphLayout = {
  branches: Array<GraphBranch>;
  vertices: Array<GraphVertex>;
  /** Number of lanes the graph uses. */
  lanes: number;
};

/** One SVG path, in pixels. */
export type GraphStroke = {
  path: string;
  colour: number;
  isCommitted: boolean;
};

/* Traversal state, built while the layout is computed. */

export type Branch = {
  colour: number;
  lines: Array<GraphLine>;
  /** Number of leading lines that belong to the uncommitted changes row. */
  uncommitted: number;
};

export type Connection = { connectsTo: Vertex | null; onBranch: Branch };

export type Vertex = {
  readonly y: number;
  readonly parents: Array<Vertex>;
  /** Parents walked so far. The rest still need a line drawn to them. */
  nextParent: number;
  branch: Branch | null;
  x: number;
  /** First lane of this row that no line uses yet. */
  nextX: number;
  connections: Array<Connection>;
  isCommitted: boolean;
  isCurrent: boolean;
};
