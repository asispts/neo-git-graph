import type { RefObject } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import { DESCRIPTION_COLUMN, RESIZABLE_COLUMNS } from "@/webview/constants";
import { saveColumnWidths, setColumnWidths } from "@/webview/lib/actions";
import { columnWidths } from "@/webview/lib/stores";
import { MIN_COLUMN, moveBoundary } from "@/webview/utils/columns";

/** Custom property that carries the width of each resizable column. */
const WIDTH_PROPERTIES = ["--col-graph", "--col-date", "--col-author", "--col-commit"] as const;

/** Pixels one arrow key moves a boundary. */
const KEY_STEP = 8;

export type ColumnResize = {
  /** Element that carries the column widths, as custom properties. */
  containerRef: RefObject<HTMLDivElement>;
  /** Row of the column headers, measured while the user resizes a column. */
  headRef: RefObject<HTMLTableRowElement>;
  resizing: boolean;
  startResize: (boundary: number, event: MouseEvent) => void;
  nudge: (boundary: number, event: KeyboardEvent) => void;
};

function applyWidths(
  container: HTMLDivElement | null,
  widths: Array<number> | null,
  graphColumn: number
) {
  if (container === null) {
    return;
  }

  if (widths === null) {
    container.style.setProperty(WIDTH_PROPERTIES[0], `${graphColumn}px`);
    for (const property of WIDTH_PROPERTIES.slice(1)) {
      container.style.removeProperty(property);
    }
    return;
  }

  for (const [index, width] of widths.entries()) {
    const property = WIDTH_PROPERTIES[index];
    if (property !== undefined) {
      container.style.setProperty(property, `${width}px`);
    }
  }
}

function cellWidth(row: HTMLTableRowElement, column: number) {
  const cell = row.cells.item(column);
  if (cell === null) {
    throw new Error("Invalid commit table column");
  }
  return cell.clientWidth;
}

/** The widths the table shows now: the saved ones, or the ones the browser chose. */
function shownWidths(row: HTMLTableRowElement) {
  return (
    columnWidths.peek() ??
    RESIZABLE_COLUMNS.map((column) => Math.max(cellWidth(row, column), MIN_COLUMN))
  );
}

/**
 * Let the user drag the boundaries of the commit table columns.
 *
 * The widths go into custom properties, which the `col` elements and the graph
 * read. A drag writes them straight to the DOM, so no commit row is rendered
 * again before the user drops the boundary.
 */
export function useColumnResize(graphColumn: number): ColumnResize {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableRowElement>(null);
  const drag = useRef<{ boundary: number; x: number; widths: Array<number> } | null>(null);
  const detach = useRef<(() => void) | null>(null);
  const [resizing, setResizing] = useState(false);

  useEffect(() => () => detach.current?.(), []);

  const widths = columnWidths.value;

  useLayoutEffect(() => {
    applyWidths(containerRef.current, widths, graphColumn);
  }, [widths, graphColumn]);

  function moveTo(clientX: number) {
    const state = drag.current;
    const row = headRef.current;
    if (state === null || row === null) {
      return;
    }

    const moved = moveBoundary(
      state.widths,
      state.boundary,
      clientX - state.x,
      cellWidth(row, DESCRIPTION_COLUMN)
    );

    state.widths = moved.widths;
    state.x += moved.moved;
    applyWidths(containerRef.current, moved.widths, graphColumn);
  }

  /**
   * Take the widths the table shows, so the columns keep them while one moves.
   * The pointer is followed from here on, and not from an effect, so that no
   * move of the mouse is lost between the press and the next render.
   */
  function startResize(boundary: number, event: MouseEvent) {
    const row = headRef.current;
    if (row === null) {
      return;
    }

    event.preventDefault();
    const shown = shownWidths(row);
    drag.current = { boundary, x: event.clientX, widths: shown };

    const move = (moveEvent: MouseEvent) => moveTo(moveEvent.clientX);
    const stop = () => {
      detach.current?.();
      const state = drag.current;
      drag.current = null;
      setResizing(false);

      if (state !== null) {
        saveColumnWidths(state.widths);
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", stop);
    detach.current = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("blur", stop);
      detach.current = null;
    };

    setColumnWidths(shown);
    setResizing(true);
  }

  function nudge(boundary: number, event: KeyboardEvent) {
    const row = headRef.current;
    if (row === null || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
      return;
    }

    event.preventDefault();
    const moved = moveBoundary(
      shownWidths(row),
      boundary,
      event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP,
      cellWidth(row, DESCRIPTION_COLUMN)
    );
    saveColumnWidths(moved.widths);
  }

  return { containerRef, headRef, resizing, startResize, nudge };
}
