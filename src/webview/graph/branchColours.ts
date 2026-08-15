/**
 * Hands out branch colours. A colour is free again once the branch holding it
 * ends, so a long list of commits stays inside a small palette. The number is
 * an index: the palette wraps it, see `palette.ts`.
 */
export function createBranchColours() {
  /** Index of the last commit each colour is taken up to. */
  const takenUntil: Array<number> = [];

  return {
    claim(startAt: number): number {
      const free = takenUntil.findIndex((end) => startAt > end);
      if (free !== -1) {
        return free;
      }

      takenUntil.push(0);
      return takenUntil.length - 1;
    },

    release(colour: number, end: number) {
      takenUntil[colour] = end;
    }
  };
}
