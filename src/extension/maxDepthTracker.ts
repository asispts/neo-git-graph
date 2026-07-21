export function createMaxDepthTracker(initialDepth: number) {
  let current = initialDepth;
  return {
    increased: (newDepth: number) => {
      const prev = current;
      current = newDepth;
      return current > prev;
    }
  };
}
