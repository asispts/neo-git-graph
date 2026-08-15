import { describe, expect, it } from "vitest";

import { isColumnWidths, moveBoundary } from "@/webview/utils/columns";

const WIDTHS = [100, 120, 120, 90];
const DESCRIPTION = 400;

describe("isColumnWidths", () => {
  it("takes one usable width per resizable column", () => {
    expect(isColumnWidths(WIDTHS)).toBe(true);
  });

  it("rejects widths of a table with another number of columns", () => {
    expect(isColumnWidths([100, 120, 120])).toBe(false);
  });

  it("rejects a width the table cannot use", () => {
    expect(isColumnWidths([100, 0, 120, 90])).toBe(false);
    expect(isColumnWidths([100, Number.NaN, 120, 90])).toBe(false);
  });

  it("rejects missing widths", () => {
    expect(isColumnWidths(null)).toBe(false);
  });
});

describe("moveBoundary", () => {
  it("widens the graph column, and leaves the other columns alone", () => {
    expect(moveBoundary(WIDTHS, 0, 30, DESCRIPTION)).toEqual({
      widths: [130, 120, 120, 90],
      moved: 30
    });
  });

  it("keeps the graph column at its minimum width", () => {
    expect(moveBoundary(WIDTHS, 0, -200, DESCRIPTION)).toEqual({
      widths: [40, 120, 120, 90],
      moved: -60
    });
  });

  it("keeps the description column at its minimum width", () => {
    expect(moveBoundary(WIDTHS, 0, 500, 100)).toEqual({
      widths: [136, 120, 120, 90],
      moved: 36
    });
  });

  it("widens the description column at the cost of the date column", () => {
    expect(moveBoundary(WIDTHS, 1, 20, DESCRIPTION)).toEqual({
      widths: [100, 100, 120, 90],
      moved: 20
    });
  });

  it("keeps the date column at its minimum width", () => {
    expect(moveBoundary(WIDTHS, 1, 300, DESCRIPTION)).toEqual({
      widths: [100, 40, 120, 90],
      moved: 80
    });
  });

  it("takes from one column what it gives to the other", () => {
    expect(moveBoundary(WIDTHS, 2, 25, DESCRIPTION)).toEqual({
      widths: [100, 145, 95, 90],
      moved: 25
    });
    expect(moveBoundary(WIDTHS, 3, -15, DESCRIPTION)).toEqual({
      widths: [100, 120, 105, 105],
      moved: -15
    });
  });

  it("stops at the minimum width of the column it takes from", () => {
    expect(moveBoundary(WIDTHS, 3, 300, DESCRIPTION)).toEqual({
      widths: [100, 120, 170, 40],
      moved: 50
    });
  });

  it("holds the boundary when both columns are already too narrow", () => {
    expect(moveBoundary([40, 40, 40, 40], 0, 30, 0)).toEqual({
      widths: [40, 40, 40, 40],
      moved: 0
    });
  });

  it("leaves the given widths unchanged", () => {
    moveBoundary(WIDTHS, 2, 25, DESCRIPTION);

    expect(WIDTHS).toEqual([100, 120, 120, 90]);
  });
});
