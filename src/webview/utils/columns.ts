import { RESIZABLE_COLUMNS } from "@/webview/constants";

/** Width a resizable column never goes below, in pixels. */
export const MIN_COLUMN = 40;

/** Width the description column never goes below, in pixels. */
export const MIN_DESCRIPTION = 64;

/**
 * How much of `delta` the two columns of a boundary take. Nothing, when the
 * table is so narrow that both columns are already under their minimum.
 */
function allowed(delta: number, min: number, max: number): number {
  return min > max ? 0 : Math.min(Math.max(delta, min), max);
}

/** The widths hold one usable width per resizable column. */
export function isColumnWidths(widths: Array<number> | null): widths is Array<number> {
  return (
    widths !== null &&
    widths.length === RESIZABLE_COLUMNS.length &&
    widths.every((width) => Number.isFinite(width) && width > 0)
  );
}

/**
 * Move the boundary that follows column `boundary` by `delta` pixels. The two
 * columns of the boundary keep their minimum width, so `moved` is `delta` cut
 * down to what the table takes. The description column takes the width the
 * others leave, which is why it is measured instead of stored.
 */
export function moveBoundary(
  widths: Array<number>,
  boundary: number,
  delta: number,
  description: number
): { widths: Array<number>; moved: number } {
  const next = [...widths];
  let moved = delta;

  switch (boundary) {
    case 0: {
      const width = next[0];
      if (width === undefined) return { widths: next, moved: 0 };
      moved = allowed(moved, MIN_COLUMN - width, description - MIN_DESCRIPTION);
      next[0] = width + moved;
      break;
    }
    case 1: {
      const width = next[1];
      if (width === undefined) return { widths: next, moved: 0 };
      moved = allowed(moved, MIN_DESCRIPTION - description, width - MIN_COLUMN);
      next[1] = width - moved;
      break;
    }
    default: {
      const left = next[boundary - 1];
      const right = next[boundary];
      if (left === undefined || right === undefined) return { widths: next, moved: 0 };
      moved = allowed(moved, MIN_COLUMN - left, right - MIN_COLUMN);
      next[boundary - 1] = left + moved;
      next[boundary] = right - moved;
    }
  }

  return { widths: next, moved };
}
