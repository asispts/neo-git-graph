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
    case 0:
      moved = allowed(moved, MIN_COLUMN - next[0], description - MIN_DESCRIPTION);
      next[0] += moved;
      break;
    case 1:
      moved = allowed(moved, MIN_DESCRIPTION - description, next[1] - MIN_COLUMN);
      next[1] -= moved;
      break;
    default:
      moved = allowed(moved, MIN_COLUMN - next[boundary - 1], next[boundary] - MIN_COLUMN);
      next[boundary - 1] += moved;
      next[boundary] -= moved;
  }

  return { widths: next, moved };
}
