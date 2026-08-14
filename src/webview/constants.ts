export const SHOW_ALL_BRANCHES = "*";

/** Hash the backend gives to the synthetic "Uncommitted Changes" row. */
export const UNCOMMITTED_CHANGES = "*";

/**
 * Metrics of the commit table, in pixels. The graph is drawn to them, so the
 * table must keep its cells exactly this high, and in pixels rather than `rem`.
 */
export const ROW_HEIGHT = 24;
export const TABLE_HEADER_HEIGHT = 32;

/** Height of the commit details view. The graph is stretched by it when open. */
export const COMMIT_DETAILS_HEIGHT = 250;

/**
 * Index in a commit row of each column the user resizes, in the order the
 * widths are stored. The description column is absent: it takes the width the
 * other columns leave.
 */
export const RESIZABLE_COLUMNS = [0, 2, 3, 4];

/** Index in a commit row of the column that takes the remaining width. */
export const DESCRIPTION_COLUMN = 1;
