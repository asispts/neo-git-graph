/** Colour of a line or dot that is not committed yet. */
export const UNCOMMITTED_COLOUR = "#808080";

/**
 * Colour of a branch. Colours repeat once the configured palette runs out, and
 * an empty palette falls back to the CSS `--color-graph` token.
 */
export function branchColour(index: number): string | undefined {
  const palette = viewState.graphColours;
  return palette.length === 0 ? undefined : palette[index % palette.length];
}
