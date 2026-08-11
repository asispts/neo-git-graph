import type { GitCommitNode } from "@/backend/types";
import { UNCOMMITTED_CHANGES } from "@/webview/constants";
import { createBranchColours } from "@/webview/graph/branchColours";
import type {
  Branch,
  GraphBranch,
  GraphLayout,
  GraphLine,
  GraphVertex,
  Vertex
} from "@/webview/graph/types";
import { connectionTo, joinBranch, nextPointOf, pointOf, takePoint } from "@/webview/graph/utils";
import { createVertex } from "@/webview/graph/vertex";

type BranchColours = ReturnType<typeof createBranchColours>;

function nextParentOf(vertex: Vertex): Vertex | null {
  return vertex.parents[vertex.nextParent] ?? null;
}

function addLine(branch: Branch, line: GraphLine) {
  branch.lines.push(line);
  if (line.isCommitted) {
    branch.uncommitted = Math.min(branch.uncommitted, line.p2.y);
  } else {
    branch.uncommitted++;
  }
}

function buildVertices(commits: Array<GitCommitNode>, commitHead: string | null): Array<Vertex> {
  const vertices = commits.map((_, index) => createVertex(index));
  const lookup = new Map(commits.map((commit, index) => [commit.hash, index]));

  commits.forEach((commit, index) => {
    for (const parentHash of commit.parentHashes) {
      const parent = lookup.get(parentHash);
      if (parent !== undefined) {
        vertices[index].parents.push(vertices[parent]);
      }
    }
  });

  if (commits[0]?.hash === UNCOMMITTED_CHANGES) {
    vertices[0].isCurrent = true;
    vertices[0].isCommitted = false;
  } else {
    const head = commitHead === null ? undefined : lookup.get(commitHead);
    if (head !== undefined) {
      vertices[head].isCurrent = true;
    }
  }

  return vertices;
}

function findStart(vertices: Array<Vertex>): number {
  return vertices.findIndex((vertex) => nextParentOf(vertex) !== null || vertex.branch === null);
}

/** Walk a merge into a parent that both already sit on a branch. */
function traceMerge(vertices: Array<Vertex>, startAt: number) {
  const vertex = vertices[startAt];
  const parentVertex = nextParentOf(vertex)!;
  const parentBranch = parentVertex.branch!;

  let lastPoint = pointOf(vertex);
  for (let i = startAt + 1; i < vertices.length; i++) {
    const connection = connectionTo(vertices[i], parentVertex, parentBranch);
    const curPoint = connection ?? nextPointOf(vertices[i]);

    addLine(parentBranch, {
      p1: lastPoint,
      p2: curPoint,
      isCommitted: vertex.isCommitted,
      lockedFirst:
        connection === null && vertices[i] !== parentVertex ? lastPoint.x < curPoint.x : true
    });
    takePoint(vertices[i], curPoint.x, parentVertex, parentBranch);
    lastPoint = curPoint;

    if (connection !== null) {
      break;
    }
  }

  // Also mark the parent processed when no point to it was found, otherwise
  // `findStart` gives back this vertex again and the walk never ends.
  vertex.nextParent++;
}

/** Walk a chain of commits down its parents, claiming one colour for it. */
function traceBranch(vertices: Array<Vertex>, startAt: number, colours: BranchColours): Branch {
  let vertex = vertices[startAt];
  let parentVertex = nextParentOf(vertex);

  const branch: Branch = { colour: colours.claim(startAt), lines: [], uncommitted: 0 };
  let lastPoint = vertex.branch === null ? nextPointOf(vertex) : pointOf(vertex);
  joinBranch(vertex, branch, lastPoint.x);
  takePoint(vertex, lastPoint.x, vertex, branch);

  let i = startAt + 1;
  for (; i < vertices.length; i++) {
    const onParent = parentVertex === vertices[i];
    const curPoint =
      onParent && parentVertex!.branch !== null ? pointOf(vertices[i]) : nextPointOf(vertices[i]);

    addLine(branch, {
      p1: lastPoint,
      p2: curPoint,
      isCommitted: vertex.isCommitted,
      lockedFirst: lastPoint.x < curPoint.x
    });
    takePoint(vertices[i], curPoint.x, parentVertex, branch);
    lastPoint = curPoint;

    if (onParent) {
      vertex.nextParent++;
      const parentWasOnBranch = parentVertex!.branch !== null;
      joinBranch(parentVertex!, branch, curPoint.x);
      vertex = parentVertex!;
      parentVertex = nextParentOf(vertex);
      if (parentWasOnBranch) {
        break;
      }
    }
  }

  colours.release(branch.colour, i);
  return branch;
}

/** A line belongs to the uncommitted changes row while it precedes the first commit. */
function toGraphBranch(branch: Branch): GraphBranch {
  return {
    colour: branch.colour,
    lines: branch.lines.map((line, index) => ({
      ...line,
      isCommitted: index >= branch.uncommitted
    }))
  };
}

function toGraphVertex(vertex: Vertex): GraphVertex {
  return {
    x: vertex.x,
    y: vertex.y,
    colour: vertex.branch?.colour ?? 0,
    isCommitted: vertex.isCommitted,
    isCurrent: vertex.isCurrent
  };
}

/**
 * Lay the commits out. Each commit is walked from a child down to its parents;
 * a walk forms a branch that claims one colour and one lane.
 */
export function computeGraphLayout(
  commits: Array<GitCommitNode>,
  commitHead: string | null
): GraphLayout {
  const vertices = buildVertices(commits, commitHead);
  const colours = createBranchColours();
  const branches: Array<Branch> = [];

  let startAt = findStart(vertices);
  while (startAt !== -1) {
    const vertex = vertices[startAt];
    const parentVertex = nextParentOf(vertex);
    const isMergeOfTwoBranches =
      parentVertex !== null &&
      vertex.parents.length > 1 &&
      vertex.branch !== null &&
      parentVertex.branch !== null;

    if (isMergeOfTwoBranches) {
      traceMerge(vertices, startAt);
    } else {
      branches.push(traceBranch(vertices, startAt, colours));
    }

    startAt = findStart(vertices);
  }

  return {
    branches: branches.map(toGraphBranch),
    vertices: vertices.map(toGraphVertex),
    lanes: vertices.reduce((lanes, vertex) => Math.max(lanes, vertex.nextX), 0)
  };
}
